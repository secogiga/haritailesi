'use client';

import { useEffect, useState } from 'react';
import { useToken } from '@/hooks/useToken';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function fmt(kurus: number) { return `${(kurus / 100).toFixed(2)} TL`; }

interface LoyaltyEntry {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const TYPE_CLS: Record<string, string> = {
  earn: 'bg-green-100 text-green-700',
  redeem: 'bg-blue-100 text-blue-700',
  expire: 'bg-red-100 text-red-700',
  adjust: 'bg-gray-100 text-gray-600',
};
const TYPE_LABELS: Record<string, string> = {
  earn: 'Kazanıldı', redeem: 'Harcandı', expire: 'Süresi Doldu', adjust: 'Düzeltme',
};

export default function PuanlarimPage() {
  const token = useToken();
  const [balance, setBalance] = useState<{ balance: number; pointsValue: string } | null>(null);
  const [history, setHistory] = useState<LoyaltyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemResult, setRedeemResult] = useState<string | null>(null);
  const [redeemErr, setRedeemErr] = useState('');

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        fetch(`${API_URL}/api/v1/store/loyalty/balance`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/v1/store/loyalty/history`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setBalance(bal as { balance: number; pointsValue: string });
      setHistory(Array.isArray(hist) ? hist as LoyaltyEntry[] : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [token]); // eslint-disable-line

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setRedeeming(true); setRedeemErr(''); setRedeemResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/store/loyalty/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points: parseInt(redeemPoints, 10) }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(e.message ?? 'Hata oluştu');
      }
      const data = await res.json() as { discountKurus: number };
      setRedeemResult(`${fmt(data.discountKurus)} indirim kuponunuz oluşturuldu!`);
      setRedeemPoints('');
      void load();
    } catch (err) {
      setRedeemErr(err instanceof Error ? err.message : 'Hata');
    } finally { setRedeeming(false); }
  }

  const inp = 'border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100';

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Bakiye kartı */}
      <div className="bg-gradient-to-br from-[#26496b] to-[#1e3a56] rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80 mb-1">Toplam Puanınız</p>
        <p className="text-5xl font-bold mb-1">{balance?.balance ?? 0}</p>
        <p className="text-sm opacity-70">≈ {balance?.pointsValue ?? '0.00'} TL değerinde</p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs opacity-60">100 puan = 1 TL indirim · Her 1 TL harcama = 1 puan</p>
        </div>
      </div>

      {/* Puan harca */}
      {(balance?.balance ?? 0) >= 100 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3">Puan Kullan</h3>
          <form onSubmit={(e) => void redeem(e)} className="flex gap-2">
            <input
              type="number"
              min="100"
              step="100"
              max={balance?.balance}
              className={`${inp} flex-1`}
              placeholder="Kaç puan kullanmak istiyorsunuz? (min. 100)"
              value={redeemPoints}
              onChange={e => setRedeemPoints(e.target.value)}
            />
            <button type="submit" disabled={redeeming || !redeemPoints}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50 transition-colors shrink-0">
              {redeeming ? '…' : 'Kullan'}
            </button>
          </form>
          {redeemPoints && parseInt(redeemPoints, 10) >= 100 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
              {parseInt(redeemPoints, 10)} puan = {fmt(Math.floor(parseInt(redeemPoints, 10) / 100) * 100)} indirim
            </p>
          )}
          {redeemResult && <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mt-2">✓ {redeemResult}</p>}
          {redeemErr && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mt-2">{redeemErr}</p>}
        </div>
      )}

      {/* Nasıl puan kazanılır */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Nasıl Puan Kazanılır?</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
          <li>• Her 1 TL alışveriş = 1 puan</li>
          <li>• 100 puan = 1 TL indirim</li>
          <li>• Puanlar 1 yıl geçerlidir</li>
        </ul>
      </div>

      {/* Geçmiş */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3">Puan Geçmişi</h3>
        {history.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
            Henüz puan işleminiz yok.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(entry => (
              <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TYPE_CLS[entry.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {TYPE_LABELS[entry.type] ?? entry.type}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{new Date(entry.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{entry.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${entry.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {entry.points > 0 ? '+' : ''}{entry.points}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">Bakiye: {entry.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
