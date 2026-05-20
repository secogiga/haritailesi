-- ─── Yeni Enum'lar ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE payment_account AS ENUM ('vakif', 'sirket');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_sub_status AS ENUM ('pending_payment', 'active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── donations tablosu güncelleme ─────────────────────────────────────────────

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS payment_account payment_account NOT NULL DEFAULT 'vakif',
  ADD COLUMN IF NOT EXISTS iyzico_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS iyzico_conversation_id TEXT;

-- ─── users tablosu güncelleme ─────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ;

-- ─── Üyelik Ücret Konfigürasyonu ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membership_fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  tier membership_tier NOT NULL,
  amount_kurus INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS mfc_year_tier_unique ON membership_fee_configs (year, tier);
CREATE INDEX IF NOT EXISTS mfc_year_idx ON membership_fee_configs (year);
CREATE INDEX IF NOT EXISTS mfc_active_idx ON membership_fee_configs (is_active);

-- ─── Üye Numarası Sayaçları ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_number_seqs (
  year SMALLINT NOT NULL,
  category TEXT NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, category)
);

-- ─── Üyelik Aboneliği ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_full_name TEXT,
  member_number TEXT NOT NULL,
  member_number_year SMALLINT NOT NULL,
  member_number_category TEXT NOT NULL,
  member_number_seq INTEGER NOT NULL,
  membership_tier membership_tier NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status membership_sub_status NOT NULL DEFAULT 'pending_payment',
  reminder_30_sent_at TIMESTAMPTZ,
  reminder_7_sent_at TIMESTAMPTZ,
  reminder_1_sent_at TIMESTAMPTZ,
  expired_notified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ms_member_number_unique ON membership_subscriptions (member_number);
CREATE INDEX IF NOT EXISTS ms_user_idx ON membership_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS ms_status_idx ON membership_subscriptions (status);
CREATE INDEX IF NOT EXISTS ms_expires_at_idx ON membership_subscriptions (expires_at);
CREATE INDEX IF NOT EXISTS ms_donation_idx ON membership_subscriptions (donation_id);

-- ─── Seed: 2026 Yılı Ücret Konfigürasyonu ─────────────────────────────────────

INSERT INTO membership_fee_configs (year, tier, amount_kurus, label, description, is_active) VALUES
  (2026, 'haritailesi_genc',    0,       'Haritailesi Genç Üyeliği',     'Öğrenci üyeliği — ücretsiz', TRUE),
  (2026, 'new_graduate_member', 0,       'Yeni Mezun Üyeliği',           'Yeni mezun üyeliği — ücretsiz', TRUE),
  (2026, 'individual_member',   175000,  'Mesleğin Değer Ortağı Bağışı', 'Bireysel yıllık üyelik bağışı — 1.750 TL', TRUE),
  (2026, 'corporate_member',    700000,  'Mesleğe Değer Katan Marka Bağışı', 'Kurumsal yıllık üyelik bağışı — 7.000 TL', TRUE)
ON CONFLICT (year, tier) DO NOTHING;
