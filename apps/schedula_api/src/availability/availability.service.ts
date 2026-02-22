import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAvailabilitySlotDto } from "./dto/create-availabilitySlot.dto";
import { AvailabilityDto } from "./dto/availability.dto";
import { CreateRecurringRuleDto } from "./dto/create-recurringRule.dto";

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) { }

  private timeToMinFromDate(d: Date) {
    return d.getHours() * 60 + d.getMinutes();
  }

  private weekdayMask(days: number[]) {
    return days.reduce((mask, d) => mask | (1 << d), 0);
  }


  async createAvailabilitySlot(userId: string, dto: CreateAvailabilitySlotDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const endTime = new Date(
        dto.startTime.getTime() + dto.durationMin * 60 * 1000,
      );

      const overlap = await this.prisma.availabilitySlot.findFirst({
        where: {
          doctorId: doctor.id,
          startTime: { lt: endTime },
          endTime: { gt: dto.startTime },
        },
      });

      if (overlap) {
        throw new BadRequestException('Slot overlaps with existing slot');
      }

      const availabilitySlot = await this.prisma.availabilitySlot.create({
        data: {
          startTime: dto.startTime,
          endTime,
          durationMin: dto.durationMin,
          sessionType: dto.sessionType,
          capacity: dto.capacity,
          bookedCount: 0,
          doctorId: doctor.id,
        },
      });

      return availabilitySlot;

    } catch (err) {
      console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getAvailableSlots(userId: string, dto: AvailabilityDto) {
    try {

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const now = new Date();

      const slots = await this.prisma.availabilitySlot.findMany({
        where: {
          doctorId: dto.doctorId,
          endTime: { gt: now },
        },
        orderBy: {
          startTime: 'asc',
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          durationMin: true,
          capacity: true,
          bookedCount: true,
          sessionType: true,
        },
      });

      return slots.filter(slot => slot.bookedCount < slot.capacity);

    } catch (err) {
      console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async createRecurringRule(userId: string, dto: CreateRecurringRuleDto) {
    try {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      const startMin = this.timeToMinFromDate(dto.startTime);
      const endMin = dto.endTime
        ? this.timeToMinFromDate(dto.endTime)
        : null;

      if (!dto.isStream) {
        if (!dto.endTime) {
          throw new BadRequestException('endTime is required for wave scheduling');
        }

        if (endMin! <= startMin) {
          throw new BadRequestException('endTime must be after startTime');
        }

        if ((endMin! - startMin) % dto.durationMin !== 0) {
          throw new BadRequestException(
            'Time window must be divisible by duration'
          );
        }
      }

      const mask = this.weekdayMask(dto.weekdays);

      const rule = await this.prisma.recurringRule.create({
        data: {
          doctorId: doctor.id,
          isStream: dto.isStream,
          weekdayMask: mask,
          startMin,
          endMin,
          durationMin: dto.durationMin,
          capacity: dto.capacity,
          validFrom: dto.validFrom,
          validUntil: dto.validUntil ?? null,
          sessionType: dto.sessionType,
        },
      });

      const generateUntil =
        dto.validUntil ??
        new Date(dto.validFrom.getTime() + 30 * 86400000);

      const slots = [];

      for (
        let d = new Date(dto.validFrom);
        d <= generateUntil;
        d.setDate(d.getDate() + 1)
      ) {
        const weekday = d.getDay();
        if ((mask & (1 << weekday)) === 0) continue;

        const baseDate = new Date(d);
        baseDate.setHours(0, 0, 0, 0);

        if (dto.isStream) {
          const start = new Date(baseDate);
          start.setMinutes(startMin);

          const end = new Date(
            start.getTime() + dto.durationMin * 60000
          );

          slots.push({
            startTime: start,
            endTime: end,
            durationMin: dto.durationMin,
            capacity: dto.capacity,
            bookedCount: 0,
            sessionType: dto.sessionType,
            doctorId: doctor.id,
            ruleId: rule.id,
          });
        }

        else {
          let currentMin = startMin;

          while (currentMin < endMin!) {
            const start = new Date(baseDate);
            start.setMinutes(currentMin);

            const end = new Date(
              start.getTime() + dto.durationMin * 60000
            );

            slots.push({
              startTime: start,
              endTime: end,
              durationMin: dto.durationMin,
              capacity: dto.capacity,
              bookedCount: 0,
              sessionType: dto.sessionType,
              doctorId: doctor.id,
              ruleId: rule.id,
            });

            currentMin += dto.durationMin;
          }
        }
      }

      if (slots.length) {
        await this.prisma.availabilitySlot.createMany({
          data: slots,
        });
      }

      return {
        ruleId: rule.id,
        generatedSlots: slots.length,
      };

    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }
}