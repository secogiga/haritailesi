import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { OtpService } from './otp.service';

class SendOtpDto {
  @IsEmail() email!: string;
}

class VerifyOtpDto {
  @IsEmail() email!: string;
  @IsString() code!: string;
}

@Controller('otp')
export class OtpController {
  constructor(private readonly service: OtpService) {}

  @Public()
  @Post('send')
  @HttpCode(200)
  async send(@Body() dto: SendOtpDto) {
    await this.service.send(dto.email);
    return { ok: true };
  }

  @Public()
  @Post('verify')
  @HttpCode(200)
  async verify(@Body() dto: VerifyOtpDto) {
    const token = await this.service.verify(dto.email, dto.code);
    return { token };
  }
}
