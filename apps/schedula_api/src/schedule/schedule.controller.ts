import {
    Controller,
    Patch,
    Param,
    Body,
    Req,
    UseGuards,
    BadRequestException,
    ForbiddenException
} from '@nestjs/common';
import { SlotMutationService } from './schedule.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('slots')
@UseGuards(JwtAuthGuard)
export class SlotMutationController {
    constructor(
        private readonly slotMutationService: SlotMutationService
    ) { }

    @Patch(':slotId/expand')
    async expandSlot(
        @Param('slotId') slotId: string,
        @Body() body: {
            newEndTime?: string;
            newCapacity?: number;
        },
        @Req() req
    ) {
        if (req.user.role !== 'DOCTOR') {
            throw new ForbiddenException('Only doctors can create availability slots')
        }

        if (!body.newEndTime && body.newCapacity == null) {
            throw new BadRequestException(
                'Provide newEndTime or newCapacity'
            );
        }

        const parsedEndTime = body.newEndTime
            ? new Date(body.newEndTime)
            : undefined;

        return this.slotMutationService.expandSlot(
            req.user.sub,
            slotId,
            parsedEndTime ?? undefined,
            body.newCapacity
        );
    }

    @Patch(':slotId/shrink')
    async shrinkSlot(
        @Param('slotId') slotId: string,
        @Body() body: {
            newEndTime?: string;
            newCapacity?: number;
        },
        @Req() req
    ) {

        if (req.user.role !== 'DOCTOR') {
            throw new ForbiddenException('Only doctors can create availability slots')
        }


        if (!body.newEndTime && body.newCapacity == null) {
            throw new BadRequestException(
                'Provide newEndTime or newCapacity'
            );
        }

        const parsedEndTime = body.newEndTime
            ? new Date(body.newEndTime)
            : undefined;

        return this.slotMutationService.shrinkSlot(
            req.user.sub,
            slotId,
            parsedEndTime ?? undefined,
            body.newCapacity
        );
    }
}