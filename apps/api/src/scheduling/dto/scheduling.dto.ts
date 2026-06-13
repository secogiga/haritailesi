import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsEnum(['membership', 'mentorship'])
  slotType?: 'membership' | 'mentorship';

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInterviewRequestDto {
  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  meetUrl?: string;
}

export class ConfirmInterviewDto {
  @IsEnum(['confirm', 'reschedule', 'pick_slot'])
  action!: 'confirm' | 'reschedule' | 'pick_slot';

  @IsOptional()
  @IsString()
  rescheduleNote?: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  meetingPreference?: string;
}
