import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { SessionType } from 'src/generated/prisma/enums';

export class CreateAvailabilitySlotDto {

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsInt()
  @Min(1)
  durationMin: number;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsInt()
  @Min(1)
  capacity: number;
}
