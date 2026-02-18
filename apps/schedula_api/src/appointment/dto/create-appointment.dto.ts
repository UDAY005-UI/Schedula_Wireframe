import { Type } from 'class-transformer';
import {IsString, IsNotEmpty, IsDate, IsNumber, MaxLength, IsEnum, IsDefined, Matches} from 'class-validator'
import { ConsultingType } from 'src/generated/prisma/enums';

export class CreateAppointmentDto {
    @Type(() => Date)
    @IsDate()
    appointmentDate: Date;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    appointmentTime: string;

    @IsEnum(ConsultingType)
    consultingType: ConsultingType;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    complaint: string;

    @IsString()
    @IsNotEmpty()
    visitType: string;

    @Type(() => Number)
    @IsNumber()
    @IsDefined()
    weight: number;

    @Type(() => Number)
    @IsNumber()
    @IsDefined()
    recordedAge: number;

    @IsString()
    @IsNotEmpty()
    doctorId: string;

    @IsString()
    @IsNotEmpty()
    slotId: string;
}