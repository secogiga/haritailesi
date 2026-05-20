#!/usr/bin/env node
/**
 * Admin kullanıcısı oluşturur.
 * Kullanım: node scripts/create-admin.js
 *
 * Gerekli ortam değişkeni: DATABASE_URL
 * Önce: cd apps/api && npx dotenv -e .env -- node ../../scripts/create-admin.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@haritailesi.org';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/haritailesi';

async function main() {
  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  try {
    const hash = await bcrypt.hash(PASSWORD, 12);

    await client.query('BEGIN');

    // Kullanıcı oluştur
    const { rows } = await client.query(`
      INSERT INTO users (email, password_hash, membership_tier, status, verification_status)
      VALUES ($1, $2, 'individual_member', 'active', 'verified')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [EMAIL, hash]);

    const userId = rows[0].id;

    // Profil oluştur
    await client.query(`
      INSERT INTO user_profiles (user_id, display_name)
      VALUES ($1, 'Sistem Yöneticisi')
      ON CONFLICT (user_id) DO NOTHING
    `, [userId]);

    // super_admin rolü ver
    await client.query(`
      INSERT INTO user_functional_roles (user_id, role, is_active)
      VALUES ($1, 'super_admin', true)
      ON CONFLICT (user_id, role) DO UPDATE SET is_active = true
    `, [userId]);

    await client.query('COMMIT');

    console.log('✅ Admin kullanıcısı oluşturuldu:');
    console.log(`   E-posta : ${EMAIL}`);
    console.log(`   Şifre   : ${PASSWORD}`);
    console.log(`   ID      : ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hata:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
