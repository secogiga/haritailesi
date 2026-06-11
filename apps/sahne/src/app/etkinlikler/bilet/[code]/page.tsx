import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const EVENT_TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

interface TicketData {
  ticketCode: string;
  attendanceId: string;
  joinedAt: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventType: string;
  dateStart: string;
  dateEnd: string | null;
  location: string | null;
  displayName: string;
  avatarUrl: string | null;
}

async function getTicket(code: string): Promise<TicketData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/tickets/${code}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<TicketData>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const ticket = await getTicket(code);
  if (!ticket) return { title: 'Bilet Bulunamadı' };
  return { title: `E-Bilet — ${ticket.eventTitle}`, robots: 'noindex' };
}

export default async function BiletPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticket = await getTicket(code);
  if (!ticket) notFound();

  const shortCode = ticket.ticketCode.split('-')[0]!.toUpperCase();
  const typeLabel = EVENT_TYPE_LABELS[ticket.eventType] ?? ticket.eventType;
  const isPast = new Date(ticket.dateStart) < new Date();

  const formattedDate = new Date(ticket.dateStart).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
  });
  const formattedEnd = ticket.dateEnd
    ? new Date(ticket.dateEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen dark:bg-[#070c1a] flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-md">

          {/* Geçerlilik rozeti */}
          <div className={`flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-full text-sm font-semibold w-fit mx-auto ${isPast ? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isPast ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}`} />
            {isPast ? 'Geçmiş Etkinlik' : 'Geçerli Bilet'}
          </div>

          {/* Bilet kartı */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">

            {/* Üst şerit */}
            <div className="bg-gradient-to-r from-[#1e3a56] to-[#26496b] px-6 py-5">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">E-BİLET · Haritailesi</p>
              <h1 className="text-lg font-black text-white leading-snug">{ticket.eventTitle}</h1>
              <span className="mt-2 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90">{typeLabel}</span>
            </div>

            {/* Kesik çizgi */}
            <div className="relative h-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] -translate-x-1/2" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] translate-x-1/2" />
              <div className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-slate-700" />
            </div>

            {/* İçerik */}
            <div className="px-6 py-5 space-y-4">
              {/* Katılımcı */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                {ticket.avatarUrl ? (
                  <img src={ticket.avatarUrl} alt={ticket.displayName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#26496b] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {ticket.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Katılımcı</p>
                  <p className="font-bold text-gray-900 dark:text-slate-100">{ticket.displayName}</p>
                </div>
              </div>

              {/* Detaylar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Tarih</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{formattedDate}{formattedEnd ? ` – ${formattedEnd}` : ''}</p>
                </div>
                {ticket.location && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Konum</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{ticket.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Bilet Kodu</p>
                  <p className="text-sm font-bold font-mono text-[#26496b] dark:text-blue-400 tracking-wider">{shortCode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Kayıt Tarihi</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{new Date(ticket.joinedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Kesik çizgi alt */}
            <div className="relative h-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] -translate-x-1/2" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] translate-x-1/2" />
              <div className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-slate-700" />
            </div>

            {/* Alt — onay işareti */}
            <div className="px-6 py-5 flex items-center justify-between bg-gray-50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPast ? 'bg-gray-200 dark:bg-slate-700' : 'bg-emerald-500'}`}>
                  <svg className={`w-5 h-5 ${isPast ? 'text-gray-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    {isPast ? 'Etkinlik Tamamlandı' : 'Katılım Onaylandı'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">Haritailesi tarafından doğrulandı</p>
                </div>
              </div>
              <Link
                href={`/etkinlikler/${ticket.eventSlug}`}
                className="text-xs font-semibold text-[var(--color-mavi)] dark:text-blue-400 hover:underline"
              >
                Etkinlik →
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
            Bu bilet kişiye özeldir. Kayıplar için iletisim@haritailesi.org
          </p>
        </div>
      </main>
    </>
  );
}
