'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { mutfakApi } from '@/lib/api';

const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'http://localhost:3002';

type Tab = 'terim' | 'rehber' | 'mevzuat' | 'sinav_sorusu' | 'gecmis';

const TAB_LABELS: Record<Tab, string> = {
  terim: 'Yeni Terim',
  rehber: 'Yeni Rehber',
  mevzuat: 'Mevzuat Ekle',
  sinav_sorusu: 'Sınav Sorusu',
  gecmis: 'Geçmiş',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  term: 'Terim', guide: 'Rehber', regulation: 'Mevzuat',
  sinav_sorusu: 'Sınav Sorusu', duzeltme: 'Düzeltme',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'İncelemede', approved: 'Onaylandı', rejected: 'Reddedildi',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const FIELD_OPTIONS = [
  'klasik_haritacilik', 'cbs', 'fotogrametri', 'kadastro', 'uzaktan_algilama',
  'gayrimenkul_degerleme', 'yazilim', 'kariyer', 'egitim', 'kamu', 'ozel_sektor', 'insaat', 'genel',
];
const FIELD_LABELS: Record<string, string> = {
  klasik_haritacilik: 'Klasik Haritacılık', cbs: 'CBS', fotogrametri: 'Fotogrametri',
  kadastro: 'Kadastro', uzaktan_algilama: 'Uzaktan Algılama',
  gayrimenkul_degerleme: 'Gayrimenkul Değerleme', yazilim: 'Yazılım',
  kariyer: 'Kariyer', egitim: 'Eğitim', kamu: 'Kamu',
  ozel_sektor: 'Özel Sektör', insaat: 'İnşaat', genel: 'Genel',
};

const inp = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#26496b]/40 focus:border-[#26496b] transition';
const label = 'block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5';

function SuccessBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Öneriniz alındı!</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Editörlerimiz inceleyip kütüphaneye ekleyecek.</p>
      <button
        onClick={onReset}
        className="px-5 py-2 text-sm font-semibold text-[#26496b] border border-[#26496b]/30 rounded-xl hover:bg-[#26496b]/5 transition-colors"
      >
        Yeni öneri gönder
      </button>
    </div>
  );
}

function TermForm({ token }: { token: string }) {
  const [form, setForm] = useState({ term: '', fullForm: '', definition: '', field: '', tags: '', seeAlso: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.term.trim() || !form.definition.trim()) { setError('Terim ve tanım zorunludur.'); return; }
    setStatus('loading'); setError('');
    const body = JSON.stringify({
      terim: form.term.trim(),
      acilimi: form.fullForm.trim() || undefined,
      tanim: form.definition.trim(),
      alan: form.field || undefined,
      etiketler: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      ilgiliTerimler: form.seeAlso.split(',').map(t => t.trim()).filter(Boolean),
    });
    try {
      await mutfakApi.submitLibraryContribution(token, { contentType: 'term', body });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi.');
      setStatus('error');
    }
  }

  if (status === 'success') return <SuccessBanner onReset={() => { setStatus('idle'); setForm({ term: '', fullForm: '', definition: '', field: '', tags: '', seeAlso: '' }); }} />;

  return (
    <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Terim Adı <span className="text-rose-500">*</span></label>
          <input className={inp} value={form.term} onChange={set('term')} placeholder="ör. Ortofoto" required />
        </div>
        <div>
          <label className={label}>Açılımı (opsiyonel)</label>
          <input className={inp} value={form.fullForm} onChange={set('fullForm')} placeholder="ör. Doğrultulmuş Fotoğraf" />
        </div>
      </div>
      <div>
        <label className={label}>Tanım <span className="text-rose-500">*</span></label>
        <textarea className={inp} rows={4} value={form.definition} onChange={set('definition')}
          placeholder="Bu terimi açıklayan kısa ve net bir tanım yazın…" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Meslek Alanı</label>
          <select className={inp} value={form.field} onChange={set('field')}>
            <option value="">Seçiniz…</option>
            {FIELD_OPTIONS.map(f => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Etiketler (virgülle ayır)</label>
          <input className={inp} value={form.tags} onChange={set('tags')} placeholder="ör. fotogrametri, hava fotoğrafı" />
        </div>
      </div>
      <div>
        <label className={label}>Ayrıca Bakınız (virgülle ayır)</label>
        <input className={inp} value={form.seeAlso} onChange={set('seeAlso')} placeholder="İlgili terimler…" />
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3350] disabled:opacity-60 transition-colors">
        {status === 'loading' ? 'Gönderiliyor…' : 'Öneri Gönder'}
      </button>
    </form>
  );
}

function GuideForm({ token }: { token: string }) {
  const [form, setForm] = useState({ title: '', summary: '', body: '', type: 'guide', field: '', tags: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) { setError('Başlık ve özet zorunludur.'); return; }
    setStatus('loading'); setError('');
    const body = JSON.stringify({
      baslik: form.title.trim(),
      ozet: form.summary.trim(),
      icerik: form.body.trim() || undefined,
      tur: form.type,
      alan: form.field || undefined,
      etiketler: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    try {
      await mutfakApi.submitLibraryContribution(token, { contentType: 'guide', body });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi.');
      setStatus('error');
    }
  }

  if (status === 'success') return <SuccessBanner onReset={() => { setStatus('idle'); setForm({ title: '', summary: '', body: '', type: 'guide', field: '', tags: '' }); }} />;

  return (
    <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
      <div>
        <label className={label}>Başlık <span className="text-rose-500">*</span></label>
        <input className={inp} value={form.title} onChange={set('title')} placeholder="ör. CBS ile Arazi Analizi Rehberi" required />
      </div>
      <div>
        <label className={label}>Özet <span className="text-rose-500">*</span></label>
        <textarea className={inp} rows={3} value={form.summary} onChange={set('summary')}
          placeholder="Rehberin içeriğini kısa özetleyin…" required />
      </div>
      <div>
        <label className={label}>İçerik (Markdown destekli, opsiyonel)</label>
        <textarea className={`${inp} font-mono text-xs`} rows={8} value={form.body} onChange={set('body')}
          placeholder="## Giriş&#10;Rehber içeriğinizi buraya yazın…" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={label}>Tür</label>
          <select className={inp} value={form.type} onChange={set('type')}>
            <option value="guide">Rehber</option>
            <option value="article">Makale</option>
            <option value="roadmap">Yol Haritası</option>
            <option value="career_guide">Kariyer Rehberi</option>
            <option value="technical_doc">Teknik Doküman</option>
          </select>
        </div>
        <div>
          <label className={label}>Meslek Alanı</label>
          <select className={inp} value={form.field} onChange={set('field')}>
            <option value="">Seçiniz…</option>
            {FIELD_OPTIONS.map(f => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Etiketler</label>
          <input className={inp} value={form.tags} onChange={set('tags')} placeholder="virgülle ayır" />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3350] disabled:opacity-60 transition-colors">
        {status === 'loading' ? 'Gönderiliyor…' : 'Öneri Gönder'}
      </button>
    </form>
  );
}

function RegulationForm({ token }: { token: string }) {
  const [form, setForm] = useState({ title: '', shortTitle: '', type: 'yonetmelik', issuingBody: '', refNo: '', publishDate: '', summary: '', externalUrl: '', field: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Başlık zorunludur.'); return; }
    setStatus('loading'); setError('');
    const body = JSON.stringify({
      baslik: form.title.trim(),
      kisaBaslik: form.shortTitle.trim() || undefined,
      tur: form.type,
      yayimlayanKurum: form.issuingBody.trim() || undefined,
      referansNo: form.refNo.trim() || undefined,
      yayimTarihi: form.publishDate || undefined,
      ozet: form.summary.trim() || undefined,
      resmiKaynak: form.externalUrl.trim() || undefined,
      alan: form.field || undefined,
    });
    try {
      await mutfakApi.submitLibraryContribution(token, { contentType: 'regulation', body });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi.');
      setStatus('error');
    }
  }

  if (status === 'success') return <SuccessBanner onReset={() => { setStatus('idle'); setForm({ title: '', shortTitle: '', type: 'yonetmelik', issuingBody: '', refNo: '', publishDate: '', summary: '', externalUrl: '', field: '' }); }} />;

  return (
    <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
      <div>
        <label className={label}>Tam Başlık <span className="text-rose-500">*</span></label>
        <input className={inp} value={form.title} onChange={set('title')} placeholder="ör. Büyük Ölçekli Harita ve Harita Bilgileri Üretim Yönetmeliği" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Kısa Başlık</label>
          <input className={inp} value={form.shortTitle} onChange={set('shortTitle')} placeholder="ör. BÖHHBÜY" />
        </div>
        <div>
          <label className={label}>Tür</label>
          <select className={inp} value={form.type} onChange={set('type')}>
            <option value="kanun">Kanun</option>
            <option value="yonetmelik">Yönetmelik</option>
            <option value="genelge">Genelge</option>
            <option value="teknik_teblig">Teknik Tebliğ</option>
            <option value="kurum_yazisi">Kurum Yazısı</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Yayımlayan Kurum</label>
          <input className={inp} value={form.issuingBody} onChange={set('issuingBody')} placeholder="ör. HGM, TKGM" />
        </div>
        <div>
          <label className={label}>Referans No</label>
          <input className={inp} value={form.refNo} onChange={set('refNo')} placeholder="ör. 31543" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Yayım Tarihi</label>
          <input type="date" className={inp} value={form.publishDate} onChange={set('publishDate')} />
        </div>
        <div>
          <label className={label}>Meslek Alanı</label>
          <select className={inp} value={form.field} onChange={set('field')}>
            <option value="">Seçiniz…</option>
            {FIELD_OPTIONS.map(f => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Özet</label>
        <textarea className={inp} rows={3} value={form.summary} onChange={set('summary')} placeholder="Mevzuatın amacını ve kapsamını kısaca açıklayın…" />
      </div>
      <div>
        <label className={label}>Resmi Kaynak URL</label>
        <input className={inp} type="url" value={form.externalUrl} onChange={set('externalUrl')} placeholder="https://www.resmigazete.gov.tr/…" />
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3350] disabled:opacity-60 transition-colors">
        {status === 'loading' ? 'Gönderiliyor…' : 'Öneri Gönder'}
      </button>
    </form>
  );
}

function ExamQuestionForm({ token }: { token: string }) {
  const [form, setForm] = useState({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '',
    correctOption: 'a', explanation: '', difficulty: 'medium', examType: 'kpss', category: '', relatedTerms: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.questionText.trim() || !form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      setError('Soru metni ve en az 4 şık zorunludur.'); return;
    }
    setStatus('loading'); setError('');
    const body = JSON.stringify({
      soruMetni: form.questionText.trim(),
      sikA: form.optionA.trim(), sikB: form.optionB.trim(), sikC: form.optionC.trim(), sikD: form.optionD.trim(),
      sikE: form.optionE.trim() || undefined,
      dogruCevap: form.correctOption,
      aciklama: form.explanation.trim() || undefined,
      zorluk: form.difficulty,
      sinavTuru: form.examType,
      kategori: form.category.trim() || undefined,
      ilgiliTerimler: form.relatedTerms.split(',').map(t => t.trim()).filter(Boolean),
    });
    try {
      await mutfakApi.submitLibraryContribution(token, { contentType: 'sinav_sorusu', body });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi.');
      setStatus('error');
    }
  }

  if (status === 'success') return <SuccessBanner onReset={() => { setStatus('idle'); setForm({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctOption: 'a', explanation: '', difficulty: 'medium', examType: 'kpss', category: '', relatedTerms: '' }); }} />;

  return (
    <form onSubmit={(e) => { void submit(e); }} className="space-y-4">
      <div>
        <label className={label}>Soru Metni <span className="text-rose-500">*</span></label>
        <textarea className={inp} rows={3} value={form.questionText} onChange={set('questionText')}
          placeholder="Soruyu buraya yazın…" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['A', 'B', 'C', 'D', 'E'] as const).map(l => (
          <div key={l}>
            <label className={label}>Şık {l} {l !== 'E' && <span className="text-rose-500">*</span>}</label>
            <input className={inp} value={form[`option${l}` as keyof typeof form]} onChange={set(`option${l}` as keyof typeof form)}
              placeholder={`Şık ${l}…`} required={l !== 'E'} />
          </div>
        ))}
        <div>
          <label className={label}>Doğru Cevap <span className="text-rose-500">*</span></label>
          <select className={inp} value={form.correctOption} onChange={set('correctOption')}>
            {['a', 'b', 'c', 'd', 'e'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Açıklama (opsiyonel)</label>
        <textarea className={inp} rows={2} value={form.explanation} onChange={set('explanation')} placeholder="Doğru cevabın açıklaması…" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={label}>Zorluk</label>
          <select className={inp} value={form.difficulty} onChange={set('difficulty')}>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
        </div>
        <div>
          <label className={label}>Sınav Türü</label>
          <select className={inp} value={form.examType} onChange={set('examType')}>
            <option value="kpss">KPSS</option>
            <option value="uzmanlik">Uzmanlık</option>
            <option value="deger">Değerleme</option>
            <option value="cbs">CBS</option>
            <option value="diger">Diğer</option>
          </select>
        </div>
        <div>
          <label className={label}>Kategori</label>
          <input className={inp} value={form.category} onChange={set('category')} placeholder="ör. Geodezi" />
        </div>
      </div>
      <div>
        <label className={label}>İlgili Terimler (virgülle ayır)</label>
        <input className={inp} value={form.relatedTerms} onChange={set('relatedTerms')} placeholder="ör. datum, projeksiyon" />
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1a3350] disabled:opacity-60 transition-colors">
        {status === 'loading' ? 'Gönderiliyor…' : 'Öneri Gönder'}
      </button>
    </form>
  );
}

function SubmissionHistory({ token }: { token: string }) {
  const [items, setItems] = useState<{
    id: string; content_type: string; content_id: string | null;
    body: string; status: string; admin_note: string | null; created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void mutfakApi.getMyLibrarySubmissions(token)
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-12">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">Henüz öneri göndermediniz.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map(item => {
        let preview = item.body;
        try {
          const parsed = JSON.parse(item.body) as Record<string, string>;
          preview = parsed['baslik'] ?? parsed['terim'] ?? parsed['soruMetni'] ?? item.body;
        } catch { /* raw */ }

        return (
          <div key={item.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold bg-[#26496b]/10 text-[#26496b] dark:bg-[#26496b]/20 px-2 py-0.5 rounded-md">
                    {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_COLORS[item.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{preview}</p>
                {item.admin_note && (
                  <p className="mt-1.5 text-xs text-gray-400 italic">Not: {item.admin_note}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function KutuphanePage() {
  const { user } = useAuth();
  const token = useToken();
  const [activeTab, setActiveTab] = useState<Tab>('terim');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Meslek Kütüphanesi</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Sözlük, rehber, mevzuat ve sınav sorularına katkı yapın.
            </p>
          </div>
          <a
            href={`${SAHNE_URL}/kutuphane`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#26496b] bg-[#26496b]/5 border border-[#26496b]/20 px-3 py-2 rounded-xl hover:bg-[#26496b]/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Kütüphaneyi Gör
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-4 bg-gradient-to-r from-[#26496b]/5 to-[#26496b]/10 border border-[#26496b]/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-[#26496b]/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-[#26496b]">Topluluk Katkısı</p>
              <p className="text-xs text-[#26496b]/70">
                Gönderdiğiniz içerikler editörlerimiz tarafından incelenir ve kütüphaneye eklenir.
                Katkınız için teşekkürler, {user?.profile?.displayName ?? 'üye'}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTab === tab
                ? 'bg-[#26496b] text-white border-[#26496b]'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-[#26496b]/40 hover:text-[#26496b]'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Form cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        {activeTab === 'gecmis' ? (
          token ? <SubmissionHistory token={token} /> : <p className="text-sm text-gray-500">Yükleniyor…</p>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {TAB_LABELS[activeTab]}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {activeTab === 'terim' && 'Sözlüğe yeni bir terim ekleyin.'}
                {activeTab === 'rehber' && 'Rehberler bölümüne yeni içerik önerin.'}
                {activeTab === 'mevzuat' && 'Mevzuat Merkezi\'ne yeni bir düzenleme ekleyin.'}
                {activeTab === 'sinav_sorusu' && 'Sınav Merkezi\'ne yeni soru ekleyin.'}
              </p>
            </div>
            {token ? (
              <>
                {activeTab === 'terim' && <TermForm token={token} />}
                {activeTab === 'rehber' && <GuideForm token={token} />}
                {activeTab === 'mevzuat' && <RegulationForm token={token} />}
                {activeTab === 'sinav_sorusu' && <ExamQuestionForm token={token} />}
              </>
            ) : (
              <p className="text-sm text-gray-500">Yükleniyor…</p>
            )}
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sözlük', href: `${SAHNE_URL}/kutuphane/sozluk`, color: 'bg-violet-50 border-violet-100 text-violet-700' },
          { label: 'Rehberler', href: `${SAHNE_URL}/kutuphane/rehberler`, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          { label: 'Mevzuat', href: `${SAHNE_URL}/kutuphane/mevzuat`, color: 'bg-rose-50 border-rose-100 text-rose-700' },
          { label: 'Sınavlar', href: `${SAHNE_URL}/kutuphane/sinavlar`, color: 'bg-[#26496b]/5 border-[#26496b]/15 text-[#26496b]' },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center gap-1.5 text-xs font-semibold border rounded-xl py-2.5 hover:opacity-80 transition-opacity ${link.color}`}
          >
            {link.label} →
          </a>
        ))}
      </div>
    </div>
  );
}
