import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  Max,
  IsDate,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { SessionType } from 'src/generated/prisma/enums';

export class CreateRecurringRuleDto {

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays: number[];

  @IsBoolean()
  isStream: boolean;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  // Required if isStream = false
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @IsInt()
  @Min(1)
  durationMin: number;

  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @Type(() => Date)
  @IsOptional()
  validUntil?: Date;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsInt()
  @Min(1)
  capacity: number;
}