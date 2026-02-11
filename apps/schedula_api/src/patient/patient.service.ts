import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PatientService {
    constructor(
        private prisma: PrismaService,
    ) {}

    async createPatientProfile(userId: string) {
        try {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if(!user) {
            throw new NotFoundException('User not found')
        }

        const patient = await this.prisma.patient.upsert({
            where: {userId: user.id},
            update: {},
            create: {
                userId: user.id,
                name: user.name,
                dob: user.dob,
                gender: user.gender,
                mobileNo: user.mobileNo
            },
        });
        
        return patient;
        } catch (err) {
            throw new InternalServerErrorException('Failed to create patient profile');
        }
    }
}