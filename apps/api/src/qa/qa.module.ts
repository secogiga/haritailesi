import { Module } from '@nestjs/common';
import { QaController } from './qa.controller';

@Module({
  controllers: [QaController],
})
export class QaModule {}
