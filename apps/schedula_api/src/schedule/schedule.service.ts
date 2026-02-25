import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotMutationService {
  constructor(private prisma: PrismaService) { }
  async expandSlot(
    userId: string,
    slotId: string,
    newEndTime?: Date,
    newCapacity?: number,
  ) {

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true },
    });

    if (!user || user.role !== 'DOCTOR' || !user.doctor)
      throw new ForbiddenException('User is not a doctor');

    const slot = await this.prisma.availabilitySlot.findFirst({
      where: { id: slotId, doctorId: user.doctor.id },
    });

    if (!slot) throw new ForbiddenException('Slot not found');

    if (!newEndTime && newCapacity == null)
      throw new BadRequestException('Provide newEndTime or newCapacity');

    if (newEndTime && newEndTime <= slot.startTime)
      throw new BadRequestException('Invalid newEndTime');

    return await this.prisma.$transaction(async (tx) => {

      const updatedEndTime = newEndTime ?? slot.endTime;

      const newDurationMin = Math.floor(
        (updatedEndTime.getTime() - slot.startTime.getTime()) / (1000 * 60)
      );

      if (newEndTime && newEndTime > slot.endTime) {

        const diff =
          newEndTime.getTime() - slot.endTime.getTime();

        const nextSlots = await tx.availabilitySlot.findMany({
          where: {
            doctorId: slot.doctorId,
            startTime: { gt: slot.startTime },
          },
          orderBy: { startTime: 'asc' },
        });

        await Promise.all(
          nextSlots.map((s) =>
            tx.availabilitySlot.update({
              where: { id: s.id },
              data: {
                startTime: new Date(s.startTime.getTime() + diff),
                endTime: new Date(s.endTime.getTime() + diff),
              },
            }),
          ),
        );
      }

      return tx.availabilitySlot.update({
        where: { id: slotId },
        data: {
          endTime: newEndTime ?? slot.endTime,
          capacity: newCapacity ?? slot.capacity,
          durationMin: newDurationMin,
        },
      });
    }, { timeout: 60000 });
  }
  async shrinkSlot(
    userId: string,
    slotId: string,
    newEndTime?: Date,
    newCapacity?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true },
    });

    if (!user || user.role !== 'DOCTOR' || !user.doctor)
      throw new ForbiddenException('User is not a doctor');

    const slot = await this.prisma.availabilitySlot.findFirst({
      where: { id: slotId, doctorId: user.doctor.id },
      include: {
        appointments: {
          orderBy: { appointmentTime: 'desc' },
        },
      },
    });

    if (!slot) throw new ForbiddenException('Slot not found');

    if (!newEndTime && newCapacity == null)
      throw new BadRequestException('Provide newEndTime or newCapacity');

    if (newEndTime && newEndTime <= slot.startTime)
      throw new BadRequestException('Invalid newEndTime');

    return await this.prisma.$transaction(async (tx) => {

      const updatedEndTime = newEndTime ?? slot.endTime;

      const newDurationMin = Math.floor(
        (updatedEndTime.getTime() - slot.startTime.getTime()) / (1000 * 60)
      );

      const durationMs =
        newEndTime
          ? newEndTime.getTime() - slot.startTime.getTime()
          : slot.endTime.getTime() - slot.startTime.getTime();

      const calculatedCapacity =
        newEndTime && durationMs > 0
          ? Math.floor((durationMs / (1000 * 60)) / slot.durationMin)
          : slot.capacity;

      const updatedCapacity =
        newCapacity ?? calculatedCapacity;

      if (updatedCapacity < 0)
        throw new BadRequestException('Capacity cannot be negative');

      if (updatedCapacity > slot.capacity && newEndTime)
        throw new BadRequestException('Shrink cannot increase capacity');

      const overflow =
        slot.bookedCount - updatedCapacity;

      if (overflow > 0) {

        const overflowAppointments =
          slot.appointments.slice(0, overflow);

        const searchUntil = new Date(
          slot.endTime.getTime() +
          3 * 24 * 60 * 60 * 1000,
        );

        const candidateSlots =
          await tx.availabilitySlot.findMany({
            where: {
              doctorId: slot.doctorId,
              sessionType: slot.sessionType,
              startTime: {
                gt: slot.endTime,
                lte: searchUntil,
              },
            },
            orderBy: { startTime: 'asc' },
          });

        const slotIncrements: Record<string, number> = {};

        for (const appointment of overflowAppointments) {

          const freeSlot = candidateSlots.find(
            (s) => s.bookedCount < s.capacity,
          );

          if (!freeSlot)
            throw new BadRequestException(
              'No free slot available within 3 days',
            );

          const offsetMs =
            freeSlot.bookedCount *
            freeSlot.durationMin *
            60 *
            1000;

          const newAppointmentTime = new Date(
            freeSlot.startTime.getTime() + offsetMs,
          );

          await tx.appointment.update({
            where: { id: appointment.id },
            data: {
              slotId: freeSlot.id,
              appointmentTime: newAppointmentTime,
            },
          });

          freeSlot.bookedCount++;

          slotIncrements[freeSlot.id] =
            (slotIncrements[freeSlot.id] || 0) + 1;
        }

        await tx.availabilitySlot.update({
          where: { id: slot.id },
          data: { bookedCount: { decrement: overflow } },
        });

        await Promise.all(
          Object.entries(slotIncrements).map(
            ([id, count]) =>
              tx.availabilitySlot.update({
                where: { id },
                data: { bookedCount: { increment: count } },
              }),
          ),
        );
      }

      return tx.availabilitySlot.update({
        where: { id: slotId },
        data: {
          endTime: newEndTime ?? slot.endTime,
          capacity: updatedCapacity,
          durationMin: newDurationMin,
        },
      });
    }, { timeout: 60000 });
  }
}