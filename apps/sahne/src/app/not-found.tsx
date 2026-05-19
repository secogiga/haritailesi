import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#070c1a] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#26496b]/10 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-[#26496b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-xs font-semibold text-[#26496b] uppercase tracking-widest mb-2">404</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sayfa bulunamadı</h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-7 max-w-xs">
        Aradığınız sayfa taşınmış veya silinmiş olabilir.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-xl transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
