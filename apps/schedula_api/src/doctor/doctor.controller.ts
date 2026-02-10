import { Controller, Post,Req, UseGuards, BadRequestException } from "@nestjs/common";
import { DoctorService } from "./doctor.service";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller('doctor')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) {}

    @Post('profile')
    @UseGuards(JwtAuthGuard)
    async createDoctorProfile(@Req() req) {
        const role = req.query.state as 'DOCTOR';

        if(!role) {
            throw new BadRequestException('Role is missing');
        }

        return this.doctorService.createDoctorProfile(req.userId, req.profile);
    }
}