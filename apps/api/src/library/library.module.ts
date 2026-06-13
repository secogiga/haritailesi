import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [LibraryController],
})
export class LibraryModule {}
