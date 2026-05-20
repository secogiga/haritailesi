import { Module } from '@nestjs/common';
import { StudentClubsController } from './student-clubs.controller';
import { StudentClubsService } from './student-clubs.service';

@Module({
  controllers: [StudentClubsController],
  providers: [StudentClubsService],
})
export class StudentClubsModule {}
