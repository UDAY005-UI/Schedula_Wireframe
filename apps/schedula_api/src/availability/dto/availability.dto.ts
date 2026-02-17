import { IsString } from "class-validator";

export class AvailabilityDto {
  @IsString()
  doctorId: string;
}
