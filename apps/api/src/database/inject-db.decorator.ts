import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from './database.constants';

export const InjectDb = () => Inject(DATABASE_TOKEN);
