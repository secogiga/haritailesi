'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi, type CmsProject } from '@/lib/api';

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

const AVATAR_COLORS = [
  { label: 'Lacivert', value: '#26496b' },
  { label: 'Teal', value: '#66aca9' },
  { label: 'Yeşil', value: '#059669' },
  { label: 'Sarı', value: '#d97706' },
  { label: 'Turuncu', value: '#f97316' },
  { label: 'Mavi', value: '#2563eb' },
  { label: 'Mor', value: '#9333ea' },
  { label: 'Kırmızı', value: '#dc2626' },
  { label: 'Pembe', value: '#db2777' },
  { label: 'Gri', value: '#4b5563' },
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

const IMPACT_DOMAINS = ['Kadastro', 'Altyapı', 'CBS', 'Fotogrametri', 'Uzaktan Algılama', 'Yapı Denetim', 'Deformasyon', 'Madencilik', 'Akıllı Şehirler'];

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

  // Temel alanlar
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

  // Künye alanları
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [gains, setGains] = useState({ time: false, cost: false, quality: false, safety: false });
  const [innovationScore, setInnovationScore] = useState({ local: false, national: false, sector: false, academic: false });
  const [maturityLevel, setMaturityLevel] = useState('');
  const [impactDomains, setImpactDomains] = useState<string[]>([]);
  const [targetAudienceInput, setTargetAudienceInput] = useState('');
  const [projectTypeInput, setProjectTypeInput] = useState('');
  const [editorialNote, setEditorialNote] = useState('');
  const [editorialScore, setEditorialScore] = useState<number | null>(null);
  const [editorialStrengthsInput, setEditorialStrengthsInput] = useState('');

  // Haritakademi alanları
  const [university, setUniversity] = useState('');
  const [graduationType, setGraduationType] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [projectCategory, setProjectCategory] = useState('');
  const [customCategory, setCustomCategory] = useState(false);
  const [awardCohortMonth, setAwardCohortMonth] = useState<number | null>(null);
  const [awardRank, setAwardRank] = useState<number | null>(null);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingKunye, setGeneratingKunye] = useState(false);
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
        // Künye
        setProblem(p.problem ?? '');
        setSolution(p.solution ?? '');
        setFeaturesInput((p.features ?? []).join('\n'));
        setGains({ time: p.gains?.time ?? false, cost: p.gains?.cost ?? false, quality: p.gains?.quality ?? false, safety: p.gains?.safety ?? false });
        setInnovationScore({ local: p.innovationScore?.local ?? false, national: p.innovationScore?.national ?? false, sector: p.innovationScore?.sector ?? false, academic: p.innovationScore?.academic ?? false });
        setMaturityLevel(p.maturityLevel ?? '');
        setImpactDomains(p.impactDomains ?? []);
        setTargetAudienceInput((p.targetAudience ?? []).join('\n'));
        setProjectTypeInput((p.projectType ?? []).join('\n'));
        setEditorialNote(p.editorialNote ?? '');
        setEditorialScore(p.editorialScore ?? null);
        setEditorialStrengthsInput((p.editorialStrengths ?? []).join('\n'));
        // Haritakademi
        setUniversity(p.university ?? '');
        setGraduationType(p.graduationType ?? '');
        setGraduationYear(p.graduationYear ?? null);
        const cat = p.projectCategory ?? '';
        setProjectCategory(cat);
        setCustomCategory(cat !== '' && !CATEGORIES.includes(cat));
        setAwardCohortMonth(p.awardCohortMonth ?? null);
        setAwardRank(p.awardRank ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerateKunye() {
    setGeneratingKunye(true);
    setError('');
    try {
      const data = await adminApi.generateKunye(id);
      if (data.problem) setProblem(data.problem as string);
      if (data.solution) setSolution(data.solution as string);
      if (data.features) setFeaturesInput((data.features as string[]).join('\n'));
      if (data.gains) setGains(data.gains as typeof gains);
      if (data.innovationScore) setInnovationScore(data.innovationScore as typeof innovationScore);
      if (data.maturityLevel) setMaturityLevel(data.maturityLevel as string);
      if (data.impactDomains) setImpactDomains(data.impactDomains as string[]);
      if (data.targetAudience) setTargetAudienceInput((data.targetAudience as string[]).join('\n'));
      if (data.projectType) setProjectTypeInput((data.projectType as string[]).join('\n'));
      if (data.editorialNote) setEditorialNote(data.editorialNote as string);
    } catch (err) {
      setError('Künye oluşturulamadı: ' + (err as Error).message);
    } finally {
      setGeneratingKunye(false);
    }
  }

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

  function toggleDomain(d: string) {
    setImpactDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Başlık zorunludur.'); return; }
    if (!slug.trim()) { setError('Slug zorunludur.'); return; }

    try {
      setSaving(true);
      setUploading(true);

      const newKeys: string[] = [];
      for (const file of newImageFiles) {
        const { key } = await adminApi.uploadFile(file);
        newKeys.push(key);
      }
      setUploading(false);

      const hashtags = hashtagInput.split(/[,\s]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean);
      const validLinks = externalLinks.filter((l) => l.label.trim() && l.href.trim());
      const allImageKeys = [...existingImageKeys, ...newKeys];
      const features = featuresInput.split('\n').map((s) => s.trim()).filter(Boolean);
      const targetAudience = targetAudienceInput.split('\n').map((s) => s.trim()).filter(Boolean);
      const projectType = projectTypeInput.split('\n').map((s) => s.trim()).filter(Boolean);

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
        // Künye
        problem: problem.trim() || null,
        solution: solution.trim() || null,
        features: features.length ? features : null,
        gains: Object.values(gains).some(Boolean) ? gains : null,
        innovationScore: Object.values(innovationScore).some(Boolean) ? innovationScore : null,
        maturityLevel: maturityLevel || null,
        impactDomains: impactDomains.length ? impactDomains : null,
        targetAudience: targetAudience.length ? targetAudience : null,
        projectType: projectType.length ? projectType : null,
        editorialNote: editorialNote.trim() || null,
        editorialScore: editorialScore,
        editorialStrengths: editorialStrengthsInput.trim()
          ? editorialStrengthsInput.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        // Haritakademi
        university: university.trim() || null,
        graduationType: graduationType.trim() || null,
        graduationYear: graduationYear,
        projectCategory: projectCategory.trim() || null,
        awardCohortMonth: awardCohortMonth,
        awardRank: awardRank,
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
  const checkboxCls = 'w-4 h-4 rounded border-gray-300 text-[var(--color-mavi)] focus:ring-[var(--color-mavi)]';

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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Type Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['sahne', 'linkedin'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'sahne' ? 'Sahne' : 'LinkedIn'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sol: Ana içerik */}
        <div className="col-span-2 space-y-4">

          {/* Temel Bilgiler */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Temel Bilgiler</h2>
            <div>
              <label className={labelCls}>Başlık *</label>
              <input type="text" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proje başlığı" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls} style={{ marginBottom: 0 }}>URL Adresi *</label>
                {title && (
                  <button type="button" onClick={() => setSlug(toSlug(title))} className="text-[11px] text-[var(--color-mavi)] hover:underline">
                    ↺ Başlıktan oluştur
                  </button>
                )}
              </div>
              <input type="text" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ornek-proje-adi" />
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

          {/* Yazar Bilgileri */}
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
                  <button key={c.value} type="button" title={c.label} onClick={() => setAuthorAvatarColor(c.value)}
                    className={`w-7 h-7 rounded-full ${authorAvatarColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                    style={{ backgroundColor: c.value }} />
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
                    <button key={c.value} type="button" title={c.label} onClick={() => setAuthorTagColor(c.value)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.value} ${authorTagColor === c.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}>
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
                  <button key={g.value} type="button" title={g.label} onClick={() => setAccentGradient(g.value)}
                    className={`w-8 h-5 rounded bg-gradient-to-r ${g.value} ${accentGradient === g.value ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          {type === 'sahne' && (
            <>
              {/* Hashtag'ler + Linkler + Görseller */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Hashtag&apos;ler</h2>
                <div>
                  <label className={labelCls}>Virgül veya boşlukla ayır</label>
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
                  <input type="file" accept="image/*" multiple
                    onChange={(e) => setNewImageFiles(Array.from(e.target.files ?? []))}
                    className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                  {newImageFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{newImageFiles.length} yeni dosya seçildi</p>
                  )}
                </div>
              </div>

              {/* ── Proje Künyesi ── */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">Proje Künyesi</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Yapısal bilgiler — sahne'de detay olarak gösterilir</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateKunye}
                    disabled={generatingKunye}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#26496b] to-[#66aca9] text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {generatingKunye ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Oluşturuluyor…
                      </>
                    ) : (
                      <>✦ AI ile Künye Oluştur</>
                    )}
                  </button>
                </div>

                <div>
                  <label className={labelCls}>Problem — hangi sorunu çözüyor?</label>
                  <textarea className={inputCls} rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Projenin çözdüğü sorunu kısaca açıkla…" />
                </div>

                <div>
                  <label className={labelCls}>Çözüm — nasıl çözüyor?</label>
                  <textarea className={inputCls} rows={2} value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Çözüm yöntemini kısaca açıkla…" />
                </div>

                <div>
                  <label className={labelCls}>Temel Özellikler (her satır bir özellik)</label>
                  <textarea className={inputCls} rows={5} value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="Tek tıkla KMZ üretimi&#10;Isı haritası oluşturma&#10;Google Earth entegrasyonu" />
                </div>

                <div>
                  <label className={labelCls}>Proje Türü (her satır bir tür)</label>
                  <textarea className={inputCls} rows={2} value={projectTypeInput} onChange={(e) => setProjectTypeInput(e.target.value)} placeholder="Masaüstü Yazılım Eklentisi&#10;Mesleki Verimlilik Aracı" />
                </div>

                <div>
                  <label className={labelCls}>Olgunluk Seviyesi</label>
                  <select className={inputCls} value={maturityLevel} onChange={(e) => setMaturityLevel(e.target.value)}>
                    <option value="">Seç…</option>
                    <option value="idea">Fikir Aşaması</option>
                    <option value="prototype">Prototip</option>
                    <option value="testing">Test Aşaması</option>
                    <option value="active">Aktif Kullanım</option>
                    <option value="commercial">Ticari Ürün</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Kazanımlar</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {([['time', 'Zaman'], ['cost', 'Maliyet'], ['quality', 'Kalite'], ['safety', 'Güvenlik']] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className={checkboxCls} checked={gains[key]} onChange={(e) => setGains((g) => ({ ...g, [key]: e.target.checked }))} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Yenilik Boyutu</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {([['local', 'Yerel Yenilik'], ['national', 'Ulusal Yenilik'], ['sector', 'Sektörel İlk'], ['academic', 'Akademik Katkı']] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className={checkboxCls} checked={innovationScore[key]} onChange={(e) => setInnovationScore((s) => ({ ...s, [key]: e.target.checked }))} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Mesleki Etki Alanı</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {IMPACT_DOMAINS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDomain(d)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          impactDomains.includes(d)
                            ? 'bg-[#26496b] text-white border-[#26496b]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Hedef Kitle (her satır bir grup)</label>
                  <textarea className={inputCls} rows={3} value={targetAudienceInput} onChange={(e) => setTargetAudienceInput(e.target.value)} placeholder="Harita Mühendisleri&#10;Altyapı Mühendisleri&#10;Şantiye Ekipleri" />
                </div>

                <div>
                  <label className={labelCls}>Haritailesi Değerlendirmesi</label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Puan (1–10):</span>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditorialScore(editorialScore === n ? null : n)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                          editorialScore === n
                            ? 'bg-[var(--color-mavi)] text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    {editorialScore && <span className="text-xs text-gray-400 ml-1">{editorialScore}/10</span>}
                  </div>
                  <textarea className={inputCls} rows={3} value={editorialNote} onChange={(e) => setEditorialNote(e.target.value)} placeholder="Editör yorumu — AI taslak oluşturur, siz düzeltin…" />
                  <div className="mt-3">
                    <label className={labelCls}>Güçlü Yönler (her satır bir madde)</label>
                    <textarea className={inputCls} rows={4} value={editorialStrengthsInput} onChange={(e) => setEditorialStrengthsInput(e.target.value)} placeholder="Tek tıkla veri dönüşümü ile zaman kazandırıyor.&#10;Saha ekiplerine anlık konum güncellemesi sağlıyor.&#10;Mevcut CAD yazılımlarıyla entegre çalışabiliyor." />
                    <p className="text-[10px] text-gray-400 mt-0.5">Sahne&apos;deki Haritailesi Değerlendirmesi kartında gösterilir.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sağ: Ayarlar */}
        <div className="space-y-4">
          {/* Künye */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Künye</h2>
            <div>
              <label className={labelCls}>Üniversite</label>
              <input type="text" className={inputCls} value={university} onChange={e => setUniversity(e.target.value)} placeholder="Karadeniz Teknik Üniversitesi" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Mezuniyet Türü</label>
                <select className={inputCls} value={graduationType} onChange={e => setGraduationType(e.target.value)}>
                  <option value="">Seç</option>
                  <option>Lise</option>
                  <option>Ön Lisans</option>
                  <option>Lisans</option>
                  <option>Yüksek Lisans</option>
                  <option>Doktora</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Mezuniyet Yılı</label>
                <input type="number" className={inputCls} value={graduationYear ?? ''} onChange={e => setGraduationYear(e.target.value ? parseInt(e.target.value) : null)} placeholder="2024" min={2000} max={2040} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Kategori</label>
              <select
                className={inputCls}
                value={customCategory ? '__custom__' : (projectCategory || '')}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setCustomCategory(true);
                    if (CATEGORIES.includes(projectCategory)) setProjectCategory('');
                  } else {
                    setCustomCategory(false);
                    setProjectCategory(e.target.value);
                  }
                }}
              >
                <option value="">— Seçiniz —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ Yeni kategori ekle…</option>
              </select>
              {customCategory && (
                <input
                  type="text"
                  className={`${inputCls} mt-2`}
                  value={projectCategory}
                  onChange={e => setProjectCategory(e.target.value)}
                  placeholder="Yeni kategori adı…"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Aylık Ödül */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Aylık Ödül</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Ay</label>
                <select className={inputCls} value={awardCohortMonth ?? ''} onChange={e => setAwardCohortMonth(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">Yok</option>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}. Ay</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Sıra</label>
                <select className={inputCls} value={awardRank ?? ''} onChange={e => setAwardRank(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">Yok</option>
                  <option value={1}>1. (Birinci)</option>
                  <option value={2}>2. (İkinci)</option>
                  <option value={3}>3. (Üçüncü)</option>
                </select>
              </div>
            </div>
            {awardCohortMonth && awardRank && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 font-medium">
                {awardCohortMonth}. Ay — {awardRank}. sıra
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Yayın</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Yayında</span>
              <button type="button" onClick={() => setIsPublished((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isPublished ? 'bg-[var(--color-mavi)]' : 'bg-gray-200'}`}>
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: authorAvatarColor }}>
                    {authorInitials || authorName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium leading-tight">{authorName || '—'}</p>
                    {authorTag && <span className={`text-[10px] px-1.5 py-0.5 rounded ${authorTagColor}`}>{authorTag}</span>}
                  </div>
                </div>
                {title && <p className="text-white text-xs font-semibold mt-2 line-clamp-2">{title}</p>}
              </div>
            </div>
          )}

          {/* Künye özet */}
          {(maturityLevel || impactDomains.length > 0 || editorialNote) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Künye Özet</h2>
              {maturityLevel && (
                <p className="text-xs text-gray-600"><span className="font-medium">Olgunluk:</span> {maturityLevel}</p>
              )}
              {impactDomains.length > 0 && (
                <p className="text-xs text-gray-600"><span className="font-medium">Alan:</span> {impactDomains.join(', ')}</p>
              )}
              {editorialNote && (
                <p className="text-xs text-gray-500 italic line-clamp-3">&ldquo;{editorialNote}&rdquo;</p>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
