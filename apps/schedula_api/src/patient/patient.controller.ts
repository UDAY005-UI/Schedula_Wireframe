import { Controller, Post, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller('patient')
export class PatientController {
    constructor(private readonly patientService: PatientService) {}

    @Post('profile')
    @UseGuards(JwtAuthGuard)
    async createPatientProfile(@Req() req) {
        const role = req.query.state as 'PATIENT';

        if(!role) {
            throw new BadRequestException('role is missing');
        }

        return this.patientService.createPatientProfile(req.userId);
    }
}