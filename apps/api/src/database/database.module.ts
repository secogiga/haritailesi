import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_TOKEN } from './database.constants';
import { createDatabase } from '@haritailesi/database';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return createDatabase(url);
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
