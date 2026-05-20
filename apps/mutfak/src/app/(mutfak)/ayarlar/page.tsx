'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
          checked ? 'bg-[#26496b]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ── Password Change ───────────────────────────────────────────────────────────

function PasswordSection() {
  const token = useToken();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('Yeni şifre en az 8 karakter olmalı.'); return; }
    if (next !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setSaving(true);
    try {
      await mutfakApi.changePassword({ currentPassword: current, newPassword: next }, token);
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">Şifre başarıyla değiştirildi.</p>}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Mevcut Şifre</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Yeni Şifre</label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          required
        />
        <p className="text-xs text-gray-400 mt-1">En az 8 karakter</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving || !current || !next || !confirm}
        className="px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Kaydediliyor…' : 'Şifreyi Değiştir'}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  { key: 'new_comment', label: 'Yorumlar', description: 'Gönderinize yeni yorum yapıldığında' },
  { key: 'new_reaction', label: 'Beğeniler', description: 'Gönderiniz beğenildiğinde' },
  { key: 'new_mention', label: 'Mention\'lar', description: 'Bir gönderide @etiketlendiğinizde' },
  { key: 'mentorship_request', label: 'Mentorluk talepleri', description: 'Size mentorluk talebi geldiğinde' },
  { key: 'mentorship_update', label: 'Mentorluk güncellemeleri', description: 'Talebinizin durumu değiştiğinde' },
  { key: 'new_follower', label: 'Takipçiler', description: 'Biri sizi takip ettiğinde' },
];

const EMAIL_TYPES = [
  { key: 'weekly_digest', label: 'Haftalık Özet', description: 'Her Pazartesi haftanın en popüler içeriklerini e-posta ile al' },
];

export default function AyarlarPage() {
  const { user } = useAuth();
  const defaultPrefs = Object.fromEntries(
    [...NOTIFICATION_TYPES, ...EMAIL_TYPES].map((t) => [t.key, true])
  );
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(defaultPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const token = useToken();

  useEffect(() => {
    if (!token) return;
    mutfakApi.getNotificationPreferences(token)
      .then((prefs) => setNotifPrefs({ ...defaultPrefs, ...prefs }))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await mutfakApi.updateNotificationPreferences(notifPrefs, token);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch { /* */ } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 font-display">Ayarlar</h1>
        <p className="text-xs text-gray-500 mt-0.5">Hesap ve uygulama tercihleri</p>
      </div>

      {/* Görünüm */}
      <Section title="Görünüm" description="Tema ve görsel tercihler">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-gray-800">Karanlık Mod</p>
            <p className="text-xs text-gray-400 mt-0.5">Tercih otomatik kaydedilir</p>
          </div>
          <ThemeToggle />
        </div>
      </Section>

      {/* Bildirimler */}
      <Section title="Bildirimler" description="Hangi durumlarda bildirim almak istiyorsunuz?">
        <div className="space-y-0">
          {NOTIFICATION_TYPES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              description={t.description}
              checked={notifPrefs[t.key] ?? true}
              onChange={(v) => setNotifPrefs((prev) => ({ ...prev, [t.key]: v }))}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => void savePrefs()}
            disabled={savingPrefs}
            className="px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 transition-colors"
          >
            {savingPrefs ? 'Kaydediliyor…' : 'Tercihleri Kaydet'}
          </button>
          {prefsSaved && <span className="text-xs text-green-600">Kaydedildi ✓</span>}
        </div>
      </Section>

      {/* E-posta */}
      <Section title="E-posta Tercihleri" description="Hangi e-postaları almak istiyorsunuz?">
        <div className="space-y-0">
          {EMAIL_TYPES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              description={t.description}
              checked={notifPrefs[t.key] ?? true}
              onChange={(v) => setNotifPrefs((prev) => ({ ...prev, [t.key]: v }))}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => void savePrefs()}
            disabled={savingPrefs}
            className="px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 transition-colors"
          >
            {savingPrefs ? 'Kaydediliyor…' : 'Tercihleri Kaydet'}
          </button>
          {prefsSaved && <span className="text-xs text-green-600">Kaydedildi ✓</span>}
        </div>
      </Section>

      {/* Hesap */}
      <Section title="Hesap Güvenliği" description="E-posta adresi ve şifre yönetimi">
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">E-posta Adresi</p>
          <p className="text-sm text-gray-800">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">E-posta değişikliği için destek@haritailesi.org ile iletişime geçin.</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-700 mb-3">Şifre Değiştir</p>
          <PasswordSection />
        </div>
      </Section>

      {/* Gizlilik */}
      <Section title="Gizlilik ve Hesap" description="Hesap yönetimi seçenekleri">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700">Hesabı Kapat</p>
              <p className="text-xs text-red-500 mt-0.5 leading-relaxed">
                Hesabınızı kapatmak için destek@haritailesi.org adresine e-posta gönderin. Verileriniz 30 gün sonra kalıcı olarak silinir.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
