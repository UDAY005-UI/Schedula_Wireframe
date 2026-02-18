import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAvailabilitySlotDto } from "./dto/create-availabilitySlot.dto";
import { AvailabilityDto } from "./dto/availability.dto";

@Injectable()
export class AvailabilityService {
    constructor(private prisma: PrismaService) { }

    async createAvailabilitySlot(userId: string, dto: CreateAvailabilitySlotDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new NotFoundException('User not found')
            }

            const doctor = await this.prisma.doctor.findUnique({
                where: { userId: userId }
            });

            if (!doctor) {
                throw new NotFoundException('Doctor not found');
            }

            if (dto.endTime <= dto.startTime) {
                throw new BadRequestException('Invalid time range');
            }

            const availabilitySlot = await this.prisma.availabilitySlot.create({
                data: {
                    date: dto.date,
                    startTime: dto.startTime,
                    endTime: dto.endTime,
                    sessionType: dto.sessionType,
                    doctorId: doctor.id,
                }
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
            const today = new Date(now.toISOString().split('T')[0]);
            const currentTime = now.toTimeString().slice(0, 5);

            const result = await this.prisma.availabilitySlot.findMany({
                where: {
                    doctorId: dto.doctorId,
                    appointments: { none: {} },
                    OR: [
                        { date: { gt: today } },
                        {
                            date: today,
                            startTime: { gte: currentTime }
                        }
                    ]
                },
                orderBy: [
                    { date: 'asc' },
                    { startTime: 'asc' }
                ],
            });

            return result;
        } catch (err) {
            console.error(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Internal server error');
        }
    }

}