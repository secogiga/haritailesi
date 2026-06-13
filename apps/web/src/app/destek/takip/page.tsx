'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const STATUS_LABELS: Record<string, string> = {
  open: 'Yeni — Atanmayı Bekliyor',
  reviewing: 'Ön İncelemede',
  awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'Ekibimizde İşlemde',
  mentoring: 'Mentöre Yönlendirildi',
  expert_review: 'Uzman İncelemesinde',
  partner_referred: 'Partnere Yönlendirildi',
  offer_pending: 'Teklif Hazırlanıyor',
  education_suggested: 'Eğitim / Etkinlik Önerildi',
  gpt_responded: 'Ön Yanıt Verildi',
  suggested: 'Öneri Paylaşıldı',
  resolved: 'Çözüldü',
  archived: 'Arşivlendi',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-50 text-red-700 border-red-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  awaiting_info: 'bg-orange-50 text-orange-700 border-orange-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  mentoring: 'bg-purple-50 text-purple-700 border-purple-200',
  expert_review: 'bg-violet-50 text-violet-700 border-violet-200',
  partner_referred: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  offer_pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  education_suggested: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  gpt_responded: 'bg-sky-50 text-sky-700 border-sky-200',
  suggested: 'bg-teal-50 text-teal-700 border-teal-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

const URGENCY_LABEL: Record<string, string> = {
  kritik: '🔴 Kritik', yuksek: '🟠 Yüksek', normal: '🟡 Normal', dusuk: '🟢 Düşük',
};

interface TicketData {
  id: string;
  ticketNo: number;
  subject: string;
  status: string;
  urgency: string | null;
  subCategory: string | null;
  adminReply: string | null;
  satisfactionScore: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function SatisfactionWidget({ feedbackId, currentScore }: { feedbackId: string; currentScore: number | null }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!score || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback/${feedbackId}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error('Gönderim başarısız');
      setSubmitted(true);
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  if (currentScore !== null) {
    const stars = '★'.repeat(currentScore) + '☆'.repeat(5 - currentScore);
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
        <p className="text-xs font-semibold text-yellow-700 mb-1">Memnuniyet Puanınız</p>
        <p className="text-2xl text-yellow-500">{stars}</p>
        <p className="text-xs text-yellow-600 mt-1">{currentScore} / 5</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-lg mb-1">🙏</p>
        <p className="text-xs font-semibold text-green-700">Değerlendirmeniz için teşekkürler!</p>
      </div>
    );
  }

  const labels = ['', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Talebinizi nasıl değerlendirirsiniz?</p>
      <div className="flex items-center justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setScore(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition-transform hover:scale-110"
          >
            {(hover || score) >= s ? '★' : '☆'}
          </button>
        ))}
      </div>
      {(hover || score) > 0 && <p className="text-xs text-center text-gray-400 mb-2">{labels[hover || score]}</p>}
      {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
      <button
        type="button"
        disabled={!score || busy}
        onClick={() => void submit()}
        className="w-full bg-[var(--color-mavi)] text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {busy ? 'Gönderiliyor…' : 'Gönder'}
      </button>
    </div>
  );
}

function TakipInner() {
  const params = useSearchParams();

  const noParam = params.get('no');
  const rateId = params.get('rate');

  const [query, setQuery] = useState(noParam ?? '');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  async function lookup(no: string) {
    const n = parseInt(no, 10);
    if (!n || n < 1) { setError('Geçerli bir talep numarası girin.'); return; }
    setLoading(true);
    setError('');
    setNotFound(false);
    setTicket(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/community/feedback/lookup?no=${n}`);
      if (res.status === 404 || res.ok && res.headers.get('content-length') === '0') {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error('Sorgulama başarısız oldu.');
      const data = await res.json() as TicketData | null;
      if (!data) { setNotFound(true); return; }
      setTicket(data);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/destek/takip?no=${n}${rateId ? `&rate=${rateId}` : ''}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (noParam) void lookup(noParam);
  }, []);

  const showSatisfaction = rateId && ticket?.status === 'resolved';
  const year = ticket ? new Date(ticket.createdAt).getFullYear() : new Date().getFullYear();
  const formattedNo = ticket ? `HDM-${year}-${String(ticket.ticketNo).padStart(4, '0')}` : '';

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Haritailesi Pusula</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Talep Durumu Sorgula</h1>
          <p className="text-white/70">Talep numaranızı girerek destek sürecinizi takip edin.</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-[60vh]">
        <div className="max-w-xl mx-auto px-4">

          {/* Arama kutusu */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Talep Numarası
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 focus:border-[var(--color-mavi)] placeholder-gray-400"
                placeholder="Örn: 42 veya HDM-2025-0042"
                value={query}
                onChange={e => setQuery(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && void lookup(query)}
              />
              <button
                type="button"
                disabled={loading || !query}
                onClick={() => void lookup(query)}
                className="bg-[var(--color-mavi)] text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? '…' : 'Sorgula'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <p className="text-[11px] text-gray-400 mt-2">
              Talep numaranız başarı mesajında ve e-postanızda yer alır (HDM-2025-0042 formatında).
            </p>
          </div>

          {/* Bulunamadı */}
          {notFound && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-semibold text-gray-700 mb-1">Talep bulunamadı</p>
              <p className="text-sm text-gray-400">
                <strong>{query}</strong> numaralı bir talep sistemimizde kayıtlı değil.
                Numarayı kontrol ederek tekrar deneyin.
              </p>
              <a href="/destek" className="mt-4 inline-block text-sm font-semibold text-[var(--color-mavi)] hover:underline">
                Yeni talep oluştur →
              </a>
            </div>
          )}

          {/* Talep kartı */}
          {ticket && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Başlık şeridi */}
                <div className="bg-[var(--color-mavi)] px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-white/60 font-medium mb-0.5">Talep Numarası</p>
                    <p className="text-lg font-bold text-white font-mono">{formattedNo}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[ticket.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Konu */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Konu</p>
                    <p className="text-sm font-semibold text-gray-800">{ticket.subject}</p>
                    {ticket.subCategory && (
                      <p className="text-xs text-gray-400 mt-0.5">{ticket.subCategory}</p>
                    )}
                  </div>

                  {/* Meta bilgiler */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Oluşturulma</p>
                      <p className="text-xs text-gray-700">{formatDate(ticket.createdAt)}</p>
                    </div>
                    {ticket.urgency && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Aciliyet</p>
                        <p className="text-xs text-gray-700">{URGENCY_LABEL[ticket.urgency] ?? ticket.urgency}</p>
                      </div>
                    )}
                    {ticket.resolvedAt && (
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wide mb-1">Çözüm Tarihi</p>
                        <p className="text-xs text-green-700">{formatDate(ticket.resolvedAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* Admin yanıtı */}
                  {ticket.adminReply && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Haritailesi Yanıtı</p>
                      <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{ticket.adminReply}</p>
                    </div>
                  )}

                  {/* Durum açıklaması */}
                  {!ticket.adminReply && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <StatusExplanation status={ticket.status} />
                    </div>
                  )}
                </div>
              </div>

              {/* Memnuniyet widget — resolved + rate param varsa ya da resolved ise göster */}
              {ticket.status === 'resolved' && (
                <SatisfactionWidget
                  feedbackId={showSatisfaction ? rateId : ticket.id}
                  currentScore={ticket.satisfactionScore}
                />
              )}

              <div className="text-center">
                <a href="/destek" className="text-xs text-gray-400 hover:text-[var(--color-mavi)] font-medium transition-colors">
                  Yeni talep oluştur →
                </a>
              </div>
            </div>
          )}

          {/* Henüz sorgu yapılmadıysa yardım notu */}
          {!ticket && !notFound && !loading && !noParam && (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-sm font-medium text-gray-500">Talep numaranızı girerek durumu öğrenebilirsiniz.</p>
              <p className="text-xs mt-2">
                Henüz talep oluşturmadıysanız{' '}
                <a href="/destek" className="text-[var(--color-mavi)] font-semibold hover:underline">buradan başlayın</a>.
              </p>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

function StatusExplanation({ status }: { status: string }) {
  const explanations: Record<string, string> = {
    open: 'Talebiniz alındı ve ekibimize iletildi. En kısa sürede değerlendirilecek.',
    reviewing: 'Talebiniz ön inceleme aşamasında. Sizi ilgili birime veya uzman kişiye yönlendireceğiz.',
    awaiting_info: 'Talebinizi daha iyi değerlendirmemiz için ek bilgiye ihtiyacımız var. Lütfen e-postanızı kontrol edin.',
    in_progress: 'Talebiniz ekibimizde aktif olarak işlem görüyor.',
    mentoring: 'Talebiniz bir mentöre yönlendirildi. Yakında sizinle iletişime geçecekler.',
    expert_review: 'Talebiniz konusunda uzman bir değerlendirme süreci başlatıldı.',
    partner_referred: 'Talebiniz ilgili partner kurum veya kişiye iletildi.',
    offer_pending: 'Talebinize yönelik bir teklif hazırlanıyor.',
    education_suggested: 'Talebinizle ilgili size uygun eğitim veya etkinlik önerisinde bulunduk.',
    gpt_responded: 'Talebinize bir ön yanıt iletildi.',
    suggested: 'Talebinize yönelik önerilerimiz paylaşıldı.',
    resolved: 'Talebiniz başarıyla çözüme kavuşturuldu. Geri bildiriminiz bizim için değerli.',
    archived: 'Talep arşivlendi.',
  };
  return <p className="text-xs text-gray-600 leading-relaxed">{explanations[status] ?? 'Talebiniz işlem sürecinde.'}</p>;
}

export default function TakipPage() {
  return (
    <Suspense>
      <TakipInner />
    </Suspense>
  );
}
