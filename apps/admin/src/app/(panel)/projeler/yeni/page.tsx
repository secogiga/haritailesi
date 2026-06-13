'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

const CATEGORIES = [
  'Mesleki Uygulama',
  'Mesleki Proje',
  'Eğitim',
  'Bilgi Paylaşımı',
  'Analiz Çalışması',
  'Mesleki Yayın',
  'Blog Yazısı',
  'Saha Ölçümü',
];

const GRADUATION_TYPES = ['Lisans', 'Yüksek Lisans', 'Doktora', 'Ön Lisans', 'Lise'];

const AVATAR_COLORS = [
  '#26496b', '#66aca9', '#059669', '#d97706', '#f97316',
  '#2563eb', '#9333ea', '#dc2626', '#db2777', '#4b5563',
];

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3);
}

function pickAvatarColor(initials: string) {
  const i = (initials.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i]!;
}

export default function YeniProjePage() {
  const router = useRouter();

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [graduationType, setGraduationType] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [title, setTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [customCategory, setCustomCategory] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Proje adı zorunludur.'); return; }
    if (!linkedinUrl.trim()) { setError('LinkedIn URL zorunludur.'); return; }
    if (!authorName.trim()) { setError('Ad Soyad zorunludur.'); return; }

    const slug = toSlug(title);
    const initials = toInitials(authorName);

    try {
      setSaving(true);
      const created = await adminApi.createProject({
        slug,
        title: title.trim(),
        body: body.trim() || null,
        status: 'active',
        isPublished: true,
        type: 'linkedin',
        authorName: authorName.trim(),
        authorInitials: initials,
        authorAvatarColor: pickAvatarColor(initials),
        accentGradient: 'from-[#26496b] to-[#1a3350]',
        linkedinUrl: linkedinUrl.trim(),
        university: university.trim() || null,
        graduationType: graduationType || null,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        projectCategory: projectCategory || null,
      });

      router.push(`/projeler/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-mavi)] focus:ring-1 focus:ring-[var(--color-mavi)]';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Haritakademi Projesi Ekle</h1>
          <p className="text-sm text-gray-500 mt-1">Haritakademi veritabanından LinkedIn projesi aktar</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projeler" className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--color-mavi)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-mavi-acik)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-4">

        {/* LinkedIn URL */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">LinkedIn Paylaşımı</h2>
          <div>
            <label className={labelCls}>Proje LinkedIn URL *</label>
            <input
              type="url"
              className={inputCls}
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/feed/update/…"
            />
          </div>
        </div>

        {/* Yazar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Haritakademici</h2>

          <div>
            <label className={labelCls}>Adı Soyadı *</label>
            <input
              type="text"
              className={inputCls}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ahmet Hakan Köksal"
            />
            {authorName && (
              <p className="mt-1 text-[11px] text-gray-400">
                Baş harfler: <span className="font-mono text-gray-600">{toInitials(authorName)}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mezuniyet Türü</label>
              <select
                className={inputCls}
                value={graduationType}
                onChange={(e) => setGraduationType(e.target.value)}
              >
                <option value="">— Seçin —</option>
                {GRADUATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Mezuniyet Yılı</label>
              <input
                type="number"
                className={inputCls}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2022"
                min={1980}
                max={2030}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Mezun Olduğu Üniversite</label>
            <input
              type="text"
              className={inputCls}
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Karadeniz Teknik Üniversitesi"
            />
          </div>
        </div>

        {/* Proje */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Proje</h2>

          <div>
            <label className={labelCls}>Proje Adı *</label>
            <input
              type="text"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Proje başlığı"
            />
            {title && (
              <p className="mt-1 text-[11px] text-gray-400 font-mono">
                sahne.haritailesi.org/projeler/<span className="text-gray-600">{toSlug(title)}</span>
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Kategori</label>
            {!customCategory ? (
              <select
                className={inputCls}
                value={projectCategory}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomCategory(true);
                    setProjectCategory('');
                  } else {
                    setProjectCategory(e.target.value);
                  }
                }}
              >
                <option value="">— Seçin —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ Yeni kategori ekle…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  className={inputCls}
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  placeholder="Yeni kategori adı"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setCustomCategory(false); setProjectCategory(''); }}
                  className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  Listeden seç
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Proje Hikayesi</label>
            <textarea
              className={inputCls}
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="LinkedIn paylaşım metni…"
            />
          </div>
        </div>

        {/* Otomatik alanlar bilgisi */}
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Otomatik oluşturulan alanlar</p>
          <p className="text-xs text-gray-400">
            URL adresi · Tür (LinkedIn) · Durum (Aktif) · Yayın durumu (Yayında) · Avatar rengi · Gradyan
          </p>
        </div>
      </div>
    </form>
  );
}
