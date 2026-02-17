import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PatientService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async createPatientProfile(userId: string, profile: any) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            })

            if (!user) {
                throw new NotFoundException('User not found')
            }

            const patient = await this.prisma.$transaction(async (tx) => {

                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        dob: profile.dob,
                        gender: profile.gender,
                        mobileNo: profile.mobileNo
                    }
                });

                return tx.patient.upsert({
                    where: { userId: user.id },
                    update: {
                        dob: profile.dob,
                        gender: profile.gender,
                        mobileNo: profile.mobileNo
                    },
                    create: {
                        userId: user.id,
                        name: user.name,
                        dob: profile.dob,
                        gender: profile.gender,
                        mobileNo: profile.mobileNo
                    }
                });

            });

            return patient;
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException(err.message);
        }
    }
}