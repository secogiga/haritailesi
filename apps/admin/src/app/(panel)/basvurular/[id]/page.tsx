'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';

type Application = {
  id: string;
  type: string;
  state: string;
  applicantEmail: string;
  formData: Record<string, unknown>;
  adminNotes: string | null;
  createdAt: string;
  stateLogs: Array<{ fromState: string | null; toState: string; createdAt: string; reason: string | null }>;
  validNextStates: string[];
};

const DURUM_ETIKET: Record<string, string> = {
  submitted: 'Gönderildi',
  under_review: 'İnceleniyor',
  interview_needed: 'Görüşme Gerekli',
  interview_scheduled: 'Görüşme Planlandı',
  interview_completed: 'Görüşme Tamamlandı',
  approved: 'Onaylandı',
  waiting_payment: 'Ödeme Bekleniyor',
  active: 'Aktif',
  rejected: 'Reddedildi',
  program_completed: 'Program Tamamlandı',
  provisionary: 'Geçici Üye',
  waitlisted: 'Bekleme Listesi',
};

const DURUM_RENK: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waiting_payment: 'bg-orange-100 text-orange-800',
  interview_needed: 'bg-purple-100 text-purple-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  interview_completed: 'bg-indigo-100 text-indigo-800',
  provisionary: 'bg-teal-100 text-teal-800',
  waitlisted: 'bg-gray-100 text-gray-700',
  program_completed: 'bg-green-100 text-green-800',
};

const TIP_ETIKET: Record<string, string> = {
  individual: 'Bireysel',
  corporate: 'Kurumsal',
  meslegin_gelecekleri: 'Mesleğin Geleceği',
  haritailesi_genc: 'Haritailesi Genç',
};

export default function BasvuruDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  async function loadApp() {
    setLoading(true);
    try {
      const data = await adminApi.getApplication(id);
      setApp(data);
      setNotes(data.adminNotes ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadApp(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTransition() {
    if (!selectedState || !app) return;
    setTransitioning(true);
    try {
      await adminApi.transitionState(id, selectedState, reason || undefined);
      await loadApp();
      setSelectedState('');
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Durum değiştirilemedi.');
    } finally {
      setTransitioning(false);
    }
  }

  async function handleSaveNotes() {
    if (!app) return;
    setSavingNotes(true);
    try {
      await adminApi.updateNotes(id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Notlar kaydedilemedi.');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
        {error ?? 'Başvuru bulunamadı.'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Geri"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.applicantEmail}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {TIP_ETIKET[app.type] ?? app.type} · {new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`ml-auto inline-flex px-3 py-1 rounded-full text-sm font-medium ${DURUM_RENK[app.state] ?? 'bg-gray-100 text-gray-700'}`}>
          {DURUM_ETIKET[app.state] ?? app.state}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form Data + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Data */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Başvuru Bilgileri</h2>
            <dl className="space-y-3">
              {Object.entries(app.formData).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                  <dt className="text-gray-500 font-medium col-span-1 break-words">{key}</dt>
                  <dd className="text-gray-900 col-span-2 break-words">
                    {Array.isArray(value)
                      ? (value as unknown[]).join(', ')
                      : typeof value === 'boolean'
                        ? (value ? 'Evet' : 'Hayır')
                        : String(value ?? '')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Admin Notları</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Başvuruyla ilgili notlarınızı buraya giriniz..."
              className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)] resize-none"
            />
            <div className="flex items-center justify-end gap-3 mt-3">
              {notesSaved && (
                <span className="text-sm text-green-600">Kaydedildi</span>
              )}
              <button
                onClick={() => void handleSaveNotes()}
                disabled={savingNotes}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-lg disabled:opacity-50 transition-colors"
              >
                {savingNotes ? 'Kaydediliyor...' : 'Notu Kaydet'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: State Machine + History */}
        <div className="space-y-6">
          {/* Transition */}
          {app.validNextStates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Durum Değiştir</h2>
              <div className="space-y-3">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)]"
                >
                  <option value="">Yeni durum seç...</option>
                  {app.validNextStates.map((state) => (
                    <option key={state} value={state}>
                      {DURUM_ETIKET[state] ?? state}
                    </option>
                  ))}
                </select>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Gerekçe (isteğe bağlı)"
                  className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-[var(--color-mavi-acik)] focus:ring-[var(--color-mavi-acik)] resize-none"
                />
                <button
                  onClick={() => void handleTransition()}
                  disabled={!selectedState || transitioning}
                  className="w-full py-2 text-sm font-medium text-white bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] rounded-lg disabled:opacity-50 transition-colors"
                >
                  {transitioning ? 'Değiştiriliyor...' : 'Durumu Güncelle'}
                </button>
              </div>
            </div>
          )}

          {/* State History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Geçmiş</h2>
            <ol className="relative border-l border-gray-200 space-y-4 ml-2">
              {app.stateLogs.map((log, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-[var(--color-mavi-acik)]" />
                  <p className="text-sm font-medium text-gray-900">
                    {log.fromState ? `${DURUM_ETIKET[log.fromState] ?? log.fromState} → ` : ''}
                    {DURUM_ETIKET[log.toState] ?? log.toState}
                  </p>
                  {log.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">{log.reason}</p>
                  )}
                  <time className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </time>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
