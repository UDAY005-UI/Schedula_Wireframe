import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
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

            if (dto.endTime <= dto.startTime) {
                throw new BadRequestException('endTime must be after startTime');
            }

            const overlap = await this.prisma.availabilitySlot.findFirst({
                where: {
                    doctorId: doctor.id,
                    startTime: { lt: dto.endTime },
                    endTime: { gt: dto.startTime },
                },
            });

            if (overlap) {
                throw new BadRequestException('Slot overlaps with existing slot');
            }

            const availabilitySlot = await this.prisma.availabilitySlot.create({
                data: {
                    startTime: dto.startTime,
                    endTime: dto.endTime,
                    sessionType: dto.sessionType,

                    capacity: dto.capacity ?? 1,
                    isStream: dto.isStream ?? false,
                    streamBufferMin: dto.streamBufferMin ?? null,

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
            });

            const available = slots.filter(
                s => s.isStream || s.bookedCount < s.capacity
            );

            return available;

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
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const startMin = this.timeToMinFromDate(dto.startTime);
    const endMin = this.timeToMinFromDate(dto.endTime);

    if (endMin <= startMin) {
      throw new BadRequestException('Invalid time range');
    }

    if (dto.slotSizeMin > (endMin - startMin)) {
      throw new BadRequestException('slotSize too large');
    }

    const mask = this.weekdayMask(dto.weekdays);

    const rule = await this.prisma.recurringRule.create({
      data: {
        doctorId: doctor.id,
        weekdayMask: mask,
        startMin,
        endMin,
        slotSizeMin: dto.slotSizeMin,
        capacity: dto.capacity ?? 1,
        isStream: dto.isStream ?? false,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil ?? null,
        sessionType: dto.sessionType,
      },
    });

    const generateUntil = dto.validUntil ??
      new Date(dto.validFrom.getTime() + 30 * 86400000);

    const slots = [];

    for (let d = new Date(dto.validFrom); d <= generateUntil; d.setDate(d.getDate() + 1)) {
      const weekday = d.getDay();
      if ((mask & (1 << weekday)) === 0) continue;

      for (let t = startMin; t + dto.slotSizeMin <= endMin; t += dto.slotSizeMin) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        start.setMinutes(t);

        const end = new Date(start.getTime() + dto.slotSizeMin * 60000);

        slots.push({
          startTime: start,
          endTime: end,
          capacity: rule.capacity,
          bookedCount: 0,
          isStream: rule.isStream,
          sessionType: rule.sessionType,
          doctorId: doctor.id,
          ruleId: rule.id,
        });
      }
    }

    if (slots.length) {
      await this.prisma.availabilitySlot.createMany({ data: slots });
    }

    return { ruleId: rule.id, generatedSlots: slots.length };

  } catch (err) {
    if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException('Internal server error');
  }
}
}