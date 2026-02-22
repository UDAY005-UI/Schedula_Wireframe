import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DoctorService {
    constructor( private prisma: PrismaService ) {}

    async createDoctorProfile(userId: string, profile: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if(!user) {
            throw new NotFoundException('User not found');
        }

        const doctor = await this.prisma.doctor.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                name: user.name,
                experience: profile.experience,
                fees: profile.fees,
                profileNote: profile.profileNote,
                specializesIn: profile.specializesIn,
                services: profile.services
            }
        })
    }
}