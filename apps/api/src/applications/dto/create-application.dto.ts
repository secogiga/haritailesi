import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import type { ApplicationType } from '@haritailesi/types';

export class CreateApplicationDto {
  @IsEnum(['individual', 'corporate', 'meslegin_gelecekleri', 'haritailesi_genc'])
  type!: ApplicationType;

  @IsEmail()
  applicantEmail!: string;

  // Tüm form alanları JSONB'de saklanır — her form tipi farklı alan setine sahip
  // Validation schema değil, client-side form validation ile yapılır
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
}
