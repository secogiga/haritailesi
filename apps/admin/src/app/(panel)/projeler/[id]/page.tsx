'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi, type CmsProject } from '@/lib/api';

const AVATAR_COLORS = [
  { label: 'Lacivert', value: 'bg-[#26496b]' },
  { label: 'Teal', value: 'bg-[#66aca9]' },
  { label: 'Yeşil', value: 'bg-emerald-600' },
  { label: 'Sarı', value: 'bg-amber-600' },
  { label: 'Turuncu', value: 'bg-orange-500' },
  { label: 'Mavi', value: 'bg-blue-600' },
  { label: 'Mor', value: 'bg-purple-600' },
  { label: 'Kırmızı', value: 'bg-red-600' },
  { label: 'Pembe', value: 'bg-pink-600' },
  { label: 'Gri', value: 'bg-gray-600' },
];

const TAG_COLORS = [
  { label: 'Yeşil', value: 'bg-emerald-100 text-emerald-700' },
  { label: 'Sarı', value: 'bg-amber-100 text-amber-700' },
  { label: 'Turuncu', value: 'bg-orange-100 text-orange-700' },
  { label: 'Mavi', value: 'bg-blue-100 text-blue-700' },
  { label: 'Mor', value: 'bg-purple-100 text-purple-700' },
  { label: 'Kırmızı', value: 'bg-red-100 text-red-700' },
  { label: 'Pembe', value: 'bg-pink-100 text-pink-700' },
  { label: 'Gri', value: 'bg-gray-100 text-gray-700' },
];

const GRADIENTS = [
  { label: 'Lacivert', value: 'from-[#26496b] to-[#1a3350]' },
  { label: 'Yeşil', value: 'from-emerald-400 to-emerald-600' },
  { label: 'Sarı', value: 'from-amber-400 to-amber-600' },
  { label: 'Turuncu', value: 'from-orange-400 to-orange-600' },
  { label: 'Mavi', value: 'from-blue-400 to-blue-600' },
  { label: 'Mor', value: 'from-purple-400 to-purple-600' },
  { label: 'Pembe', value: 'from-pink-400 to-pink-600' },
  { label: 'Teal', value: 'from-teal-400 to-teal-600' },
];

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ExternalLink { label: string; href: string }

export default function EditProjePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [type, setType] = useState<'sahne' | 'linkedin'>('sahne');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [isPublished, setIsPublished] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorInitials, setAuthorInitials] = useState('');
  const [authorAvatarColor, setAuthorAvatarColor] = useState(AVATAR_COLORS[0]!.value);
  const [authorTag, setAuthorTag] = useState('');
  const [authorTagColor, setAuthorTagColor] = useState(TAG_COLORS[0]!.value);
  const [accentGradient, setAccentGradient] = useState(GRADIENTS[0]!.value);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [existingImageKeys, setExistingImageKeys] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getProject(id)
      .then((p: CmsProject) => {
        setType((p.type as 'sahne' | 'linkedin') ?? 'sahne');
        setTitle(p.title);
        setSlug(p.slug);
        setSummary(p.summary ?? '');
        setBody(p.body ?? '');
        setStatus(p.status);
        setIsPublished(p.isPublished);
        setAuthorName(p.authorName ?? '');
        setAuthorInitials(p.authorInitials ?? '');
        setAuthorAvatarColor(p.authorAvatarColor ?? AVATAR_COLORS[0]!.value);
        setAuthorTag(p.authorTag ?? '');
        setAuthorTagColor(p.authorTagColor ?? TAG_COLORS[0]!.value);
        setAccentGradient(p.accentGradient ?? GRADIENTS[0]!.value);
        setLinkedinUrl(p.linkedinUrl ?? '');
        setHashtagInput((p.hashtags ?? []).join(', '));
        setExternalLinks(p.externalLinks ?? []);
        setExistingImageKeys(p.imageKeys ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function addExternalLink() {
    setExternalLinks((l) => [...l, { label: '', href: '' }]);
  }

  function updateExternalLink(i: number, field: 'label' | 'href', val: string) {
    setExternalLinks((l) => l.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }

  function removeExternalLink(i: number) {
    setExternalLinks((l) => l.filter((_, idx) => idx !== i));
  }

  function removeExistingImage(key: string) {
    setExistingImageKeys((k) => k.filter((x) => x !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Başlık zorunludur.'); return; }
    if (!slug.trim()) { setError('Slug zorunludur.'); return; }
    if (type === 'linkedin' && !linkedinUrl.trim()) { setError('LinkedIn URL zorunludur.'); return; }

    try {
      setSaving(true);
      setUploading(true);

      const newKeys: string[] = [];
      for (const file of newImageFiles) {
        const { key } = await adminApi.uploadFile(file);
        newKeys.push(key);
      }
      setUploading(false);

      const hashtags = hashtagInput
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);

      const validLinks = externalLinks.filter((l) => l.label.trim() && l.href.trim());
      const allImageKeys = [...existingImageKeys, ...newKeys];

      await adminApi.updateProject(id, {
        slug: slug.trim(),
        title: title.trim(),
        summary: summary.trim() || null,
        body: body.trim() || null,
        status,
        isPublished,
        type,
        authorName: authorName.trim() || null,
        authorInitials: authorInitials.trim() || null,
        authorAvatarColor: authorAvatarColor || null,
        authorTag: authorTag.trim() || null,
        authorTagColor: authorTagColor || null,
        accentGradient: accentGradient || null,
        linkedinUrl: type === 'linkedin' ? linkedinUrl.trim() : null,
        hashtags: hashtags.length ? hashtags : null,
        externalLinks: validLinks.length ? validLinks : null,
        imageKeys: allImageKeys.length ? allImageKeys : null,
      });

      router.push('/projeler');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-mavi)] focus:ring-1 focus:ring-[var(--color-mavi)]';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  if (loading) return <p className="text-gray-500 p-6">Yükleniyor…</p>;
  if (notFound) return (
    <div className="p-6">
      <p className="text-red-600 mb-4">Proje bulunamadı.</p>
      <Link href="/projeler" className="text-[var(--color-mavi)] hover:underline text-sm">← Projelere dön</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeyi Düzenle</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{slug}</p>
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
            {uploading ? 'Yükleniyor…' : saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Type Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['sahne', 'linkedin'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              type === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'sahne' ? 'Sahne' : 'LinkedIn'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Temel Bilgiler</h2>

            <div>
              <label className={labelCls}>Başlık *</label>
              <input type="text" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proje başlığı" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls} style={{marginBottom: 0}}>URL Adresi *</label>
                {title && (
                  <button
                    type="button"
                    onClick={() => setSlug(toSlug(title))}
                    className="text-[11px] text-[var(--color-mavi)] hover:underline"
                  >
                    ↺ Başlıktan yeniden oluştur
                  </button>
                )}
              </div>
              <input type="text" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ornek-proje-adi" />
              {slug && (
                <p className="mt-1 text-[11px] text-gray-400 font-mono">
                  sahne.haritailesi.org/projeler/<span className="text-gray-600">{slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Özet</label>
              <textarea className={inputCls} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Kısa açıklama" />
            </div>

            {type === 'sahne' && (
              <div>
                <label className={labelCls}>İçerik (body)</label>
                <textarea className={inputCls} rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Proje detayları…" />
              </div>
            )}

            {type === 'linkedin' && (
              <div>
                <label className={labelCls}>LinkedIn URL *</label>
                <input type="url" className={inputCls} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/feed/update/…" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Yazar Bilgileri</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ad Soyad</label>
                <input type="text" className={inputCls} value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ahmet Hakan Köksal" />
              </div>
              <div>
                <label className={labelCls}>Baş Harfler</label>
                <input type="text" className={inputCls} maxLength={3} value={authorInitials} onChange={(e) => setAuthorInitials(e.target.value.toUpperCase())} placeholder="AHK" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Avatar Rengi</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setAuthorAvatarColor(c.value)}
                    className={`w-7 h-7 rounded-full ${c.value} ${authorAvatarColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Etiket</label>
                <input type="text" className={inputCls} value={authorTag} onChange={(e) => setAuthorTag(e.target.value)} placeholder="CBS & 3B Modelleme" />
              </div>
              <div>
                <label className={labelCls}>Etiket Rengi</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setAuthorTagColor(c.value)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.value} ${authorTagColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Vurgu Gradyanı</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    title={g.label}
                    onClick={() => setAccentGradient(g.value)}
                    className={`w-8 h-5 rounded bg-gradient-to-r ${g.value} ${accentGradient === g.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {type === 'sahne' && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Hashtag&apos;ler</h2>
                <div>
                  <label className={labelCls}>Hashtag&apos;ler (virgül veya boşlukla ayır)</label>
                  <input type="text" className={inputCls} value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} placeholder="CBS, 3B, web, haritakademi" />
                  {hashtagInput && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hashtagInput.split(/[,\s]+/).filter(Boolean).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">#{t.replace(/^#/, '')}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">Dış Linkler</h2>
                  <button type="button" onClick={addExternalLink} className="text-xs text-[var(--color-mavi)] hover:underline">+ Ekle</button>
                </div>
                {externalLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input type="text" placeholder="Etiket" className={`${inputCls} flex-1`} value={link.label} onChange={(e) => updateExternalLink(i, 'label', e.target.value)} />
                    <input type="url" placeholder="https://…" className={`${inputCls} flex-2`} value={link.href} onChange={(e) => updateExternalLink(i, 'href', e.target.value)} />
                    <button type="button" onClick={() => removeExternalLink(i)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1.5">×</button>
                  </div>
                ))}
                {externalLinks.length === 0 && <p className="text-xs text-gray-400">Henüz link yok.</p>}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">Görseller</h2>
                {existingImageKeys.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Mevcut görseller:</p>
                    {existingImageKeys.map((key) => (
                      <div key={key} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                        <span className="font-mono text-gray-600 truncate max-w-xs">{key}</span>
                        <button type="button" onClick={() => removeExistingImage(key)} className="text-red-400 hover:text-red-600 ml-2">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Yeni görseller ekle:</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setNewImageFiles(Array.from(e.target.files ?? []))}
                    className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {newImageFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{newImageFiles.length} yeni dosya seçildi</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Yayın</h2>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Yayında</span>
              <button
                type="button"
                onClick={() => setIsPublished((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isPublished ? 'bg-[var(--color-mavi)]' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isPublished ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            <div>
              <label className={labelCls}>Durum</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="active">Aktif</option>
                <option value="completed">Tamamlandı</option>
                <option value="archived">Arşivlendi</option>
              </select>
            </div>
          </div>

          {(authorInitials || authorName) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Önizleme</h2>
              <div className={`rounded-xl bg-gradient-to-br ${accentGradient} p-3`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${authorAvatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                    {authorInitials || authorName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium leading-tight">{authorName || '—'}</p>
                    {authorTag && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${authorTagColor}`}>{authorTag}</span>
                    )}
                  </div>
                </div>
                {title && <p className="text-white text-xs font-semibold mt-2 line-clamp-2">{title}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
