import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsString, Matches } from 'class-validator';
import { SessionType } from 'src/generated/prisma/enums';

export class CreateAvailabilitySlotDto {

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @IsEnum(SessionType)
  sessionType: SessionType;
}
