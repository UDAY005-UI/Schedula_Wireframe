import { IsString } from "class-validator";

export class AppointmentIdDto {
  @IsString()
  appointmentId: string;
}
