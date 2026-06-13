'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

type TrainingDetail = {
  id: string; slug: string; title: string;
  instructor: string | null; instructorTitle: string | null; instructorBio: string | null; instructorAvatarKey: string | null;
  description: string | null; level: string | null; format: string | null; duration: string | null;
  price: string | null; memberPrice: string | null; registrationUrl: string | null;
  totalLessons: number; totalMinutes: number; avgRating: number | null; reviewCount: number;
  prerequisites: string[];
  sections: Array<{
    id: string; title: string;
    lessons: Array<{ id: string; slug: string; title: string; contentType: string; durationMinutes: number | null; isFree: boolean; quizId?: string; createdAt?: string }>;
  }>;
};

type PaymentStatus = { id: string; status: string; amount: string } | null;

function IyzicoCheckoutButton({ trainingId, token }: { trainingId: string; token: string | null }) {
  const [loading, setLoading] = useState(false);
  const [formHtml, setFormHtml] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function startCheckout() {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/payments/iyzico/checkout/${trainingId}`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { token?: string; checkoutFormContent?: string; error?: string };
      if (data.error) { setError(data.error); return; }
      if (data.checkoutFormContent) setFormHtml(data.checkoutFormContent);
    } catch { setError('Ödeme başlatılamadı.'); }
    finally { setLoading(false); }
  }

  if (formHtml) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white">
        <div dangerouslySetInnerHTML={{ __html: formHtml }} />
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button onClick={() => void startCheckout()} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors disabled:opacity-60">
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : '💳'}
        {loading ? 'Yükleniyor…' : 'Kredi / Banka Kartı ile Öde'}
      </button>
    </div>
  );
}

type EnrollmentStatus = { id: string; progressPct: number; completedAt: string | null } | null;

const CONTENT_ICONS: Record<string, string> = { video: '▶', text: '📄', pdf: '📎', quiz: '✏️', live: '🔴' };

export default function CourseOverviewPage({ params }: { params: Promise<{ trainingSlug: string }> }) {
  const { trainingSlug } = use(params);
  const token = useToken();
  const [course, setCourse] = useState<TrainingDetail | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentStatus>(undefined as unknown as EnrollmentStatus);
  const [enrolling, setEnrolling] = useState(false);
  const [payment, setPayment] = useState<PaymentStatus>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; createdAt: string }>>([]);
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; comment: string | null; createdAt: string; displayName: string | null }>>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/cms/trainings/${trainingSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: TrainingDetail | null) => {
        if (!d) return;
        setCourse(d);
        fetch(`${API_URL}/api/v1/cms/trainings/${d.id}/announcements`)
          .then(r => r.ok ? r.json() : [])
          .then(a => setAnnouncements(a as typeof announcements))
          .catch(() => {});
        fetch(`${API_URL}/api/v1/cms/trainings/${d.slug}/reviews`)
          .then(r => r.ok ? r.json() : [])
          .then(r => setReviews(r as typeof reviews))
          .catch(() => {});
      })
      .catch(() => {});
  }, [trainingSlug]);

  useEffect(() => {
    if (!token || !course) return;
    fetch(`${API_URL}/api/v1/cms/trainings/${course.id}/enrollment-status`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(d => setEnrollment(d as EnrollmentStatus)).catch(() => setEnrollment(null));

    fetch(`${API_URL}/api/v1/cms/trainings/${course.id}/my-progress`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(d => setCompletedLessonIds(d as string[])).catch(() => {});

    // Bekleyen ödeme talebini kontrol et
    if (course.price) {
      fetch(`${API_URL}/api/v1/cms/payments/mine`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : [])
        .then((payments: Array<{ id: string; status: string; amount: string; trainingId?: string }>) => {
          const p = payments.find(p => p.status === 'pending');
          if (p) setPayment(p);
        }).catch(() => {});
    }
  }, [token, course]);

  async function enroll() {
    if (!course || !token) return;
    setEnrolling(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/trainings/${course.id}/enroll`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json() as { enrollmentId: string };
        setEnrollment({ id: d.enrollmentId, progressPct: 0, completedAt: null });
      }
    } finally { setEnrolling(false); }
  }

  async function requestPayment() {
    if (!course || !token) return;
    setRequesting(true); setPaymentError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/trainings/${course.id}/payment-request`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentRef: paymentRef.trim() || undefined }),
      });
      if (res.ok) {
        const d = await res.json() as { paymentId: string; status: string; amount: string };
        setPayment({ id: d.paymentId, status: d.status, amount: d.amount });
        setPaymentRef('');
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setPaymentError(err.message ?? 'Ödeme talebi gönderilemedi.');
      }
    } finally { setRequesting(false); }
  }

  async function submitReview() {
    if (!course || !token || reviewRating === 0) return;
    setSubmittingReview(true); setReviewError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/cms/trainings/${course.id}/reviews`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() || undefined }),
      });
      if (res.ok) {
        const r = await res.json() as { id: string; rating: number; comment: string | null; createdAt: string };
        setReviews(prev => [{ ...r, displayName: 'Sen' }, ...prev]);
        setMyReviewId(r.id);
        setReviewRating(0); setReviewComment('');
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setReviewError(err.message ?? 'Yorum gönderilemedi.');
      }
    } finally { setSubmittingReview(false); }
  }

  if (!course) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
    </div>
  );

  const totalLessons = course.sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const firstLesson = course.sections[0]?.lessons[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Başlık */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          {course.level && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{course.level}</span>}
          {course.format && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.format}</span>}
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-2">{course.title}</h1>
        {course.description && <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{course.description}</p>}
        {course.instructor && (
          <p className="text-xs text-gray-400 mt-2">👤 {course.instructor}{course.instructorTitle ? ` · ${course.instructorTitle}` : ''}</p>
        )}
      </div>

      {/* Önkoşul uyarısı */}
      {course.prerequisites && course.prerequisites.length > 0 && !enrollment && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">Önerilen Ön Koşullar</p>
          <div className="space-y-1.5">
            {course.prerequisites.map(slug => (
              <Link key={slug} href={`/egitim/${slug}`}
                className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 hover:underline">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dış kayıt linki olan kurslar */}
      {course.registrationUrl && !enrollment && (
        <div className="bg-[var(--color-mavi)]/5 dark:bg-slate-800 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Bu eğitime harici platformdan kayıt olabilirsiniz.</p>
          <a href={course.registrationUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors">
            🔗 Kayıt Ol →
          </a>
        </div>
      )}

      {/* Enrollment / Ödeme durumu — sadece platform kursları (registrationUrl olmayan) */}
      {course.registrationUrl ? null : enrollment === undefined ? null : enrollment ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Kaydoldunuz ✓</p>
            <span className="text-sm font-bold text-emerald-700">%{enrollment.progressPct}</span>
          </div>
          <div className="w-full bg-emerald-200/50 dark:bg-emerald-800/30 rounded-full h-2 mb-3">
            <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${enrollment.progressPct}%` }} />
          </div>
          {firstLesson && (
            <Link href={`/egitim/${trainingSlug}/ders/${firstLesson.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
              {enrollment.progressPct === 0 ? '▶ Kursa Başla' : enrollment.progressPct === 100 ? '✓ Tekrar Gözden Geçir' : '▶ Kaldığın Yerden Devam Et'}
            </Link>
          )}
        </div>
      ) : payment ? (
        /* Bekleyen ödeme talebi */
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">⏳ Ödeme Onay Bekliyor</p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            {course.price} tutarındaki ödeme talebiniz inceleniyor. Onaylandığında kursa erişebileceksiniz.
          </p>
        </div>
      ) : course.price ? (
        /* Ücretli kurs — ödeme seçenekleri */
        <div className="bg-[var(--color-mavi)]/5 dark:bg-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Kurs Ücreti</p>
            <span className="text-lg font-black text-[var(--color-mavi)]">{course.price}</span>
          </div>
          {course.memberPrice && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">Üye fiyatı: {course.memberPrice}</p>
          )}

          {/* Kredi kartı ile ödeme */}
          <IyzicoCheckoutButton trainingId={course.id} token={token} />

          {/* Ayırıcı */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide">veya</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Havale / EFT */}
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Havale/EFT için dekont referansını girin:</p>
          <input
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            placeholder="Dekont / referans no (opsiyonel)"
            className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 mb-2"
          />
          {paymentError && <p className="text-xs text-red-500 mb-2">{paymentError}</p>}
          <button onClick={() => void requestPayment()} disabled={requesting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-mavi)] border border-[var(--color-mavi)]/30 hover:bg-[var(--color-mavi)]/5 rounded-xl transition-colors disabled:opacity-60">
            {requesting ? 'Gönderiliyor…' : '🏦 Havale/EFT Talebi Gönder'}
          </button>
        </div>
      ) : (
        /* Ücretsiz kurs — direkt kayıt */
        <div className="bg-[var(--color-mavi)]/5 dark:bg-slate-800 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Bu kursa kayıt olmak için aşağıdaki butona tıklayın.</p>
          <button onClick={() => void enroll()} disabled={enrolling}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl transition-colors disabled:opacity-60">
            {enrolling ? 'Kaydediliyor…' : '🎓 Kursa Kayıt Ol'}
          </button>
        </div>
      )}

      {/* Duyurular */}
      {announcements.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
            📢 Duyurular
            <span className="text-xs font-normal text-gray-400">({announcements.length})</span>
          </h2>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-0.5">{a.title}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-blue-400 mt-1">{new Date(a.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Müfredat */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-3">
          Müfredat <span className="text-sm font-normal text-gray-400">({totalLessons} ders)</span>
        </h2>
        <div className="space-y-2">
          {course.sections.map((section, si) => (
            <div key={section.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{si + 1}. {section.title}</span>
                <span className="text-xs text-gray-400">
                  {section.lessons.length} ders
                  {(() => { const mins = section.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0); return mins > 0 ? ` · ${mins}dk` : ''; })()}
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {section.lessons.map((lesson, li) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const canAccess = !!enrollment || lesson.isFree;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                        {isCompleted ? '✓' : li + 1}
                      </span>
                      {canAccess ? (
                        <Link href={`/egitim/${trainingSlug}/ders/${lesson.slug}`} className="flex-1 text-sm text-gray-800 dark:text-slate-200 hover:text-[var(--color-mavi)] transition-colors">
                          {CONTENT_ICONS[lesson.contentType] ?? '▶'} {lesson.title}
                        </Link>
                      ) : (
                        <span className="flex-1 text-sm text-gray-400 dark:text-slate-500">🔒 {lesson.title}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        {lesson.isFree && <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded font-semibold">Ücretsiz</span>}
                        {lesson.createdAt && (Date.now() - new Date(lesson.createdAt).getTime()) < 14 * 86400000 && (
                          <span className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded font-bold">Yeni</span>
                        )}
                        {lesson.durationMinutes && <span className="text-xs text-gray-400">{lesson.durationMinutes}dk</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yorumlar */}
      {(enrollment || reviews.length > 0) && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            ⭐ Yorumlar
            {course.avgRating && <span className="text-sm font-normal text-gray-400">{course.avgRating} · {course.reviewCount} yorum</span>}
          </h2>

          {/* Yorum formu — sadece kayıtlı ve henüz yorum yapmamış kullanıcılara */}
          {enrollment && !myReviewId && (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-3">Bu kurs hakkında yorum yap</p>
              {/* Yıldız seçici */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setReviewRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'}`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Kurs hakkındaki düşüncelerinizi paylaşın (opsiyonel)…"
                rows={3}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-mavi)]/30 resize-none mb-2"
              />
              {reviewError && <p className="text-xs text-red-500 mb-2">{reviewError}</p>}
              <button onClick={() => void submitReview()} disabled={submittingReview || reviewRating === 0}
                className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-dark)] rounded-xl disabled:opacity-50 transition-colors">
                {submittingReview ? 'Gönderiliyor…' : 'Yorum Gönder'}
              </button>
            </div>
          )}

          {/* Yorum listesi */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className="text-xs text-gray-400">{r.displayName ?? 'Üye'}</span>
                    <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                    <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">İlk yorumu sen yap!</p>
          )}
        </div>
      )}
    </div>
  );
}
