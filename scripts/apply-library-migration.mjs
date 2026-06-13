#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DB_URL = process.env.DATABASE_URL
  ?? 'postgresql://haritailesi:2562803,Seco.@localhost:5432/haritailesi';

const sqlFile = resolve(ROOT, 'packages/database/migrations/0044_library_extend.sql');
const sqlText = readFileSync(sqlFile, 'utf8');

const sql = postgres(DB_URL, { max: 1, onnotice: () => {} });

sql.unsafe(sqlText)
  .then(() => { console.log('Migration basarili.'); return sql.end(); })
  .catch(err => { console.error('Hata:', err.message, err.code); process.exit(1); });
