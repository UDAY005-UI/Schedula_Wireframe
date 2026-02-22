import { IsUUID, IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { ConsultingType } from '@prisma/client';

export class CreateAppointmentDto {

  @IsUUID()
  slotId: string;

  @IsEnum(ConsultingType)
  consultingType: ConsultingType;

  @IsString()
  complaint: string;

  @IsString()
  visitType: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  recordedAge?: number;
}
