'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface TestItem {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  passingScore: number | null;
  timeLimit: number | null;
  responseCount: number;
  status: string;
}

export default function SirketTestiPage() {
  const [step, setStep] = useState<'landing' | 'browse' | 'create_request'>('landing');
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactEmail: '', testTitle: '', notes: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function loadTests() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/surveys?type=test`);
      if (res.ok) {
        const data = await res.json() as TestItem[];
        setTests(data.filter(t => t.status === 'active'));
      }
    } catch {}
    setLoading(false);
    setStep('browse');
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/surveys/company-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json() as { message?: string }).message ?? 'Hata');
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-[#0c1a2e] py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full mb-6">
              Şirketler için
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Toplu Test & Değerlendirme
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Adaylarınızı veya ekibinizi mesleki testlerimizle değerlendirin.
              Tüm sonuçları tek panelden takip edin.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => void loadTests()}
                className="px-7 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl transition-colors text-sm"
              >
                Mevcut Testleri Gör →
              </button>
              <button
                onClick={() => setStep('create_request')}
                className="px-7 py-3.5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors text-sm"
              >
                Özel Test Talebi
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 py-14">
          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              { icon: '📊', title: 'Toplu Davet', desc: 'Test linkini adaylara gönderin. Sonuçları otomatik toplanır.' },
              { icon: '🏆', title: 'Skor Tablosu', desc: 'Tüm adayların performansını tek tabloda karşılaştırın.' },
              { icon: '📜', title: 'Sertifika', desc: 'Başarılı adaylara otomatik doğrulanabilir sertifika üretilir.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Sample test preview */}
          {step === 'landing' && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold text-gray-900">Örnek Test</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">Önizleme</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Test header */}
                <div className="bg-gradient-to-r from-[#0c1a2e] to-[#1e3a5f] px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-bold text-base">CBS Yeterlilik Testi 2026</h3>
                      <p className="text-gray-300 text-xs mt-1">Coğrafi Bilgi Sistemleri temel yetkinlik değerlendirmesi</p>
                    </div>
                    <div className="shrink-0 flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>20 dk</span>
                      <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4"/></svg>Geçme: %70</span>
                    </div>
                  </div>
                </div>
                {/* Sample questions */}
                <div className="divide-y divide-gray-50">
                  {[
                    {
                      no: 1,
                      q: 'Vektör veri modelinde bir "poligon" geometrisi aşağıdakilerden hangisini temsil eder?',
                      opts: ['Tek bir koordinat noktası', 'İki nokta arasındaki düz çizgi', 'Kapalı alan sınırı ile çevrili yüzey', 'Z değerine sahip nokta bulutu'],
                      correct: 2,
                    },
                    {
                      no: 2,
                      q: 'WGS84 koordinat sistemi hangi tür bir sistemdir?',
                      opts: ['Yerel düzlem koordinat sistemi', 'Küresel coğrafi koordinat sistemi', 'UTM izdüşüm sistemi', 'Gauss-Krüger sistemi'],
                      correct: 1,
                    },
                  ].map(item => (
                    <div key={item.no} className="px-6 py-5">
                      <p className="text-sm font-medium text-gray-800 mb-3">
                        <span className="text-sky-500 font-bold mr-2">{item.no}.</span>{item.q}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {item.opts.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                            i === item.correct
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-gray-100 bg-gray-50 text-gray-500'
                          }`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              i === item.correct ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>{String.fromCharCode(65 + i)}</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                  <p className="text-xs text-gray-400">5 soru · Çoktan seçmeli · Otomatik değerlendirme</p>
                  <button
                    onClick={() => void loadTests()}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    Tüm testleri gör →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browse tests */}
          {step === 'browse' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Mevcut Testler</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
                </div>
              ) : tests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
                  Aktif test bulunamadı.
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
                        {t.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>}
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                          {t.timeLimit && <span>{Math.round(t.timeLimit / 60)} dk</span>}
                          {t.passingScore && <span>Geçme: %{t.passingScore}</span>}
                          <span>{t.responseCount.toLocaleString('tr-TR')} katılım</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/sen-ne-dersin/${t.slug ?? t.id}`;
                            void navigator.clipboard.writeText(url);
                          }}
                          className="px-3 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Linki Kopyala
                        </button>
                        <Link
                          href={`/sen-ne-dersin/${t.slug ?? t.id}/sonuclar`}
                          className="px-3 py-2 text-xs font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] transition-colors"
                        >
                          Sonuçlar →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-center">
                <button onClick={() => setStep('create_request')} className="text-sm text-[#26496b] font-semibold hover:underline">
                  Özel test içeriği mi istiyorsunuz? Talep oluşturun →
                </button>
              </div>
            </div>
          )}

          {/* Custom request */}
          {step === 'create_request' && (
            <div className="max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Özel Test Talebi</h2>
              {sent ? (
                <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Talebiniz alındı!</h3>
                  <p className="text-sm text-gray-500">En kısa sürede iletişime geçeceğiz.</p>
                </div>
              ) : (
                <form onSubmit={(e) => void sendRequest(e)} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Şirket Adı *</label>
                    <input required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]"
                      value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                      placeholder="Şirket adı" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">İletişim E-postası *</label>
                    <input required type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]"
                      value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                      placeholder="email@sirket.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Test Konusu *</label>
                    <input required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b]"
                      value={form.testTitle} onChange={e => setForm(f => ({ ...f, testTitle: e.target.value }))}
                      placeholder="Örn: CBS uzman değerlendirme testi" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ek Notlar</label>
                    <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] resize-none"
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Kaç kişi için, hangi seviye, özel istekler…" />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
                  <button type="submit" className="w-full py-3.5 bg-[#26496b] text-white font-bold rounded-2xl hover:bg-[#1e3a56] transition-colors text-sm">
                    Talep Gönder
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
