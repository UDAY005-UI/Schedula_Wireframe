import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { AppointmentStatus } from "src/generated/prisma/enums";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";

@Injectable()
export class AppointmentService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async createAppointment(userId: string, dto: CreateAppointmentDto) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!patient) {
                throw new NotFoundException('Patient not found');
            }

            const result = await this.prisma.$transaction(async (tx) => {

                const slot = await tx.availabilitySlot.findUnique({
                    where: { id: dto.slotId },
                });

                if (!slot) {
                    throw new NotFoundException('Slot not found');
                }

                if (slot.startTime <= new Date()) {
                    throw new BadRequestException('Slot already started');
                }

                // Atomic capacity check
                const updated = await tx.availabilitySlot.updateMany({
                    where: {
                        id: slot.id,
                        bookedCount: { lt: slot.capacity },
                    },
                    data: {
                        bookedCount: { increment: 1 },
                    },
                });

                if (updated.count === 0) {
                    throw new BadRequestException('Slot is full');
                }

                const appointment = await tx.appointment.create({
                    data: {
                        patientId: patient.id,
                        doctorId: slot.doctorId,
                        slotId: slot.id,
                        appointmentDate: slot.startTime,
                        appointmentTime: slot.startTime,
                        consultingType: dto.consultingType,
                        complaint: dto.complaint,
                        visitType: dto.visitType,
                        weight: dto.weight,
                        recordedAge: dto.recordedAge,
                        status: AppointmentStatus.BOOKED,
                    },
                });

                return appointment;
            });

            return result.status;

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }


    async markAppointmentCompleted(userId: string, appointmentId: string) {
        try {
            const doctor = await this.prisma.doctor.findUnique({
                where: { userId },
            });

            if (!doctor) {
                throw new NotFoundException('Doctor not found');
            }

            const appt = await this.prisma.appointment.findFirst({
                where: { id: appointmentId, doctorId: doctor.id },
            });

            if (!appt) {
                throw new NotFoundException('Appointment not found');
            }

            if (appt.status !== AppointmentStatus.BOOKED) {
                throw new BadRequestException('Only BOOKED appointments can be completed');
            }

            const updated = await this.prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: AppointmentStatus.COMPLETED },
            });

            return updated.status;

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

    async cancelAppointment(userId: string, appointmentId: string) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId },
            });

            if (!patient) {
                throw new NotFoundException('Patient not found');
            }

            await this.prisma.$transaction(async (tx) => {

                const appt = await tx.appointment.findFirst({
                    where: { id: appointmentId, patientId: patient.id },
                });

                if (!appt) {
                    throw new NotFoundException('Appointment not found');
                }

                if (appt.status !== AppointmentStatus.BOOKED) {
                    throw new BadRequestException('Only BOOKED appointments can be cancelled');
                }

                await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { status: AppointmentStatus.CANCELLED },
                });

                await tx.availabilitySlot.update({
                    where: { id: appt.slotId },
                    data: {
                        bookedCount: { decrement: 1 },
                    },
                });

            });

            return AppointmentStatus.CANCELLED;

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

    async rescheduleAppointment(userId: string, dto: RescheduleAppointmentDto) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!patient) {
                throw new NotFoundException("Patient not found");
            }

            await this.prisma.$transaction(async (tx) => {
                const appt = await tx.appointment.findFirst({
                    where: {
                        id: dto.appointmentId,
                        patientId: patient.id,
                    },
                });

                if (!appt) {
                    throw new NotFoundException("Appointment not found");
                }

                if (appt.status !== AppointmentStatus.BOOKED) {
                    throw new BadRequestException(
                        "Only BOOKED appointments can be rescheduled"
                    );
                }

                const oldSlot = await tx.availabilitySlot.findUnique({
                    where: { id: appt.slotId },
                });

                if (!oldSlot) {
                    throw new NotFoundException("Original slot not found");
                }

                const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
                if (oldSlot.startTime <= cutoff) {
                    throw new BadRequestException(
                        "Reschedule allowed only if appointment is more than 24 hours away"
                    );
                }

                const newSlot = await tx.availabilitySlot.findUnique({
                    where: { id: dto.newSlotId },
                });

                if (!newSlot) {
                    throw new NotFoundException("New slot not found");
                }

                if (newSlot.startTime <= new Date()) {
                    throw new BadRequestException("New slot already started");
                }

                if (newSlot.doctorId !== appt.doctorId) {
                    throw new BadRequestException(
                        "Cannot reschedule to a different doctor"
                    );
                }

                // Step 1: Increment new slot safely
                const increment = await tx.availabilitySlot.updateMany({
                    where: {
                        id: newSlot.id,
                        bookedCount: { lt: newSlot.capacity },
                    },
                    data: {
                        bookedCount: { increment: 1 },
                    },
                });

                if (increment.count === 0) {
                    throw new BadRequestException("New slot is full");
                }

                // Step 2: Decrement old slot
                await tx.availabilitySlot.update({
                    where: { id: oldSlot.id },
                    data: { bookedCount: { decrement: 1 } },
                });

                // Step 3: Update appointment
                await tx.appointment.update({
                    where: { id: dto.appointmentId },
                    data: {
                        slotId: newSlot.id,
                        doctorId: newSlot.doctorId,
                        appointmentDate: newSlot.startTime,
                        appointmentTime: newSlot.startTime,
                    },
                });
            });

            return { message: "Appointment rescheduled successfully" };

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException("Internal server error");
        }
    }

    async getDoctorAppointments(userId: string) {
        try {
            const doctor = await this.prisma.doctor.findUnique({
                where: { userId },
            });

            if (!doctor) {
                throw new NotFoundException('Doctor not found');
            }

            const appointments = await this.prisma.appointment.findMany({
                where: {
                    doctorId: doctor.id,
                },

                include: {
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            mobileNo: true,
                            gender: true,
                        },
                    },
                    slot: {
                        select: {
                            id: true,
                            startTime: true,
                            endTime: true,
                            sessionType: true,
                        },
                    },
                },

                orderBy: {
                    slot: {
                        startTime: 'asc',
                    },
                },
            });

            return appointments;

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

    async getPatientAppointments(userId: string) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId },
            });

            if (!patient) {
                throw new NotFoundException('Patient not found');
            }

            const appointments = await this.prisma.appointment.findMany({
                where: {
                    patientId: patient.id,
                },

                include: {
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            experience: true,
                            fees: true,
                            specializesIn: true,
                        },
                    },
                    slot: {
                        select: {
                            id: true,
                            startTime: true,
                            endTime: true,
                            sessionType: true,
                        },
                    },
                },

                orderBy: {
                    slot: {
                        startTime: 'asc',
                    },
                },
            });

            return appointments;

        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

}