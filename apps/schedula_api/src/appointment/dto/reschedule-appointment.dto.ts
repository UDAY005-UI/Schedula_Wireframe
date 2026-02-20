import { IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsUUID()
  appointmentId: string;

  @IsUUID()
  newSlotId: string;
}
