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

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsInt()
  @Min(5)
  slotSizeMin: number;

  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @Type(() => Date)
  @IsOptional()
  validUntil?: Date;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isStream?: boolean;
}
