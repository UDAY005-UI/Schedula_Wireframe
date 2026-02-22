import { Controller, Post,Req, UseGuards, Body, ForbiddenException } from "@nestjs/common";
import { DoctorService } from "./doctor.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

@Controller('doctor')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) {}

    @Post('profile')
    @UseGuards(JwtAuthGuard)
    async createDoctorProfile(@Req() req, @Body() body) {

        if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can create doctor profile');
    }

        return this.doctorService.createDoctorProfile(req.user.sub, body);
    }
}