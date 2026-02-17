import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { AppointmentStatus } from "src/generated/prisma/enums";

@Injectable()
export class AppointmentService {
    constructor(
        private prisma: PrismaService,
    ) {}

    async createAppointment(userId: string, dto: CreateAppointmentDto) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId: userId },
            });

            if (!patient) {
                throw new NotFoundException('Patient not found.')
            }

            const appointment = await this.prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    doctorId: dto.doctorId,
                    slotId: dto.slotId,
                    appointmentDate: dto.appointmentDate,
                    appointmentTime: dto.appointmentTime,
                    consultingType: dto.consultingType,
                    complaint: dto.complaint,
                    visitType: dto.visitType,
                    weight: dto.weight,
                    recordedAge: dto.recordedAge,
                    status: AppointmentStatus.BOOKED,
                },
            });

            return appointment.status;
        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

    async markAppointmentCompleted(userId: string, appointmentId: string) {
        try {
            const doctor = await this.prisma.doctor.findUnique({
                where: { userId: userId }
            });

            if (!doctor) {
                throw new NotFoundException('Doctor not found')
            }

            const appointment = await this.prisma.appointment.findFirst({
                where: { id: appointmentId, doctorId: doctor.id }
            });

            if (!appointment) {
                throw new NotFoundException('Appoinment not found')
            }

            if (appointment.status !== AppointmentStatus.BOOKED) {
                throw new BadRequestException('Only BOOKED appointments can be completed');
            }

            const result = await this.prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: AppointmentStatus.COMPLETED,
                }
            });
            return result.status;
        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error')
        }
    }

    async cancelAppointment(userId: string, appointmentId: string) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { userId: userId }
            });

            if (!patient) {
                throw new NotFoundException('Patient not found')
            }

            const appointment = await this.prisma.appointment.findFirst({
                where: { id: appointmentId, patientId: patient.id }
            });

            if (!appointment) {
                throw new NotFoundException('Appoinment not found')
            }

            if (appointment.status !== AppointmentStatus.BOOKED) {
                throw new BadRequestException('Only BOOKED appointments can be cancelled');
            }

            const result = await this.prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: AppointmentStatus.CANCELLED,
                }
            });
            return result.status;
        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error')
        }
    }
}