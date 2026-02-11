import { Controller, Post, Req, UseGuards, BadRequestException, Body, ForbiddenException } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller('patient')
export class PatientController {
    constructor(private readonly patientService: PatientService) { }

    @Post('profile')
    @UseGuards(JwtAuthGuard)
    async createPatientProfile(@Req() req, @Body() body) {

        if (req.user.role !== 'PATIENT') {
            throw new ForbiddenException('Only patients can create doctor profile');
        }

        return this.patientService.createPatientProfile(req.user.sub, body);
    }
}