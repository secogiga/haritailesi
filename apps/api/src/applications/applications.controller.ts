import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Herkese açık — giriş yapmadan başvuru yapılabilir
  @Public()
  @Post()
  submit(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.submit(dto);
  }

  // Giriş yapmış kullanıcının kendi başvuru durumunu görür (provisionary)
  @Get('my-status')
  myStatus(@CurrentUser() user: RequestUser) {
    return this.applicationsService.getStatusByEmail(user.email);
  }
}
