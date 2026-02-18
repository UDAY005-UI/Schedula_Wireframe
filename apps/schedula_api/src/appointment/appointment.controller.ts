import { Controller, Post, UseGuards, Body, ForbiddenException, Req } from "@nestjs/common";
import { AppointmentService } from "./appointment.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { AppointmentIdDto } from "./dto/appointment.dto";
import { JwtAuthGuard } from "src/auth/jwt.guard";

@Controller('appointment')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Post('create-appointment')
    @UseGuards(JwtAuthGuard)
    async createAppointment(@Req() req, @Body() dto: CreateAppointmentDto) {
        
        if(req.user.role !== 'PATIENT') {
            throw new ForbiddenException('Only patients can create appointment')
        }

        return this.appointmentService.createAppointment(req.user.sub, dto);
    }

    @Post('cancel-appointment')
    @UseGuards(JwtAuthGuard)
    async cancelAppointment(@Req() req, @Body() dto: AppointmentIdDto) {
        
        if(req.user.role !== 'PATIENT') {
            throw new ForbiddenException('Only patients can cancel appointment')
        }

        return this.appointmentService.cancelAppointment(req.user.sub, dto.appointmentId);
    }

    @Post('complete-appointment')
    @UseGuards(JwtAuthGuard)
    async markAppointmentCompleted(@Req() req, @Body() dto: AppointmentIdDto) {
        
        if(req.user.role !== 'DOCTOR') {
            throw new ForbiddenException('Only doctors can mark appointment completed')
        }

    
            return this.appointmentService.markAppointmentCompleted(req.user.sub, dto.appointmentId);
    }
}