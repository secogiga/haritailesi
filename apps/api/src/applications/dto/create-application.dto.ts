import { IsEmail, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import type { ApplicationType } from '@haritailesi/types';

export class CreateApplicationDto {
  @IsEnum(['individual', 'corporate', 'meslegin_gelecekleri', 'haritailesi_genc'])
  type!: ApplicationType;

  @IsEmail()
  applicantEmail!: string;

  // Tüm form alanları JSONB'de saklanır — her form tipi farklı alan setine sahip
  @IsObject()
  formData!: Record<string, unknown>;
}

export class TransitionStateDto {
  @IsString()
  toState!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  // Ödeme onayı (waiting_payment → waiting_verification) için
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentAmountKurus?: number;

  @IsOptional()
  @IsString()
  paymentDescription?: string;
}
