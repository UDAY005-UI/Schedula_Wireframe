import { Controller, Post, Get, Req, Body, Query, ForbiddenException, UseGuards } from "@nestjs/common";
import { AvailabilityDto } from "./dto/availability.dto";
import { CreateAvailabilitySlotDto } from "./dto/create-availabilitySlot.dto";
import { CreateRecurringRuleDto } from "./dto/create-recurringRule.dto";
import { AvailabilityService } from "./availability.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

@Controller('availability')
export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService) {}

    @Post('create-availabilitySlot')
    @UseGuards(JwtAuthGuard)
    async createAvailabilitySlot(@Req() req, @Body() dto: CreateAvailabilitySlotDto) {

        if(req.user.role !== 'DOCTOR') {
            throw new ForbiddenException('Only doctors can create availability slots')
        }

        return this.availabilityService.createAvailabilitySlot(req.user.sub, dto);
    }

    @Get('get-availableSlots')
    @UseGuards(JwtAuthGuard)
    async getAvailableSlots(@Req() req, @Query() dto: AvailabilityDto) {

        return this.availabilityService.getAvailableSlots(req.user.sub, dto);
    }

    @Post('create-recurringRule')
    @UseGuards(JwtAuthGuard)
    async createrecurringRule(@Req() req, @Body() dto: CreateRecurringRuleDto) {

        if(req.user.role !== 'DOCTOR') {
            throw new ForbiddenException('Only doctors can create recurring slots')
        }

        return this.availabilityService.createRecurringRule(req.user.sub, dto);
    }
}