import { Module } from "@nestjs/common";
import { SlotMutationController } from "./schedule.controller";
import { SlotMutationService } from "./schedule.service";

@Module({
    controllers: [SlotMutationController],
    providers: [SlotMutationService],
}) 
export class ScheduleModule {}