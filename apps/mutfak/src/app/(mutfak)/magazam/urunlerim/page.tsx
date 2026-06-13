'use client';

import { useEffect, useState } from 'react';
import { useToken } from '@/hooks/useToken';
import { mutfakApi as api, type StoreProduct } from '@/lib/api';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';

function fmt(k: number) { return `${(k / 100).toFixed(0)} TL`; }

const EMPTY = {
  slug: '', title: '', subtitle: '', description: '',
  type: 'digital' as 'digital' | 'physical' | 'app',
  price: '', memberPrice: '', downloadUrl: '', stock: '', tags: '', badgeLabel: '',
  status: 'draft' as 'draft' | 'active',
};

export default function SaticiUrunlerimPage() {
  const token = useToken();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<{ id: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const [sellerData, productsData] = await Promise.all([
        api.getMySellerProfile(token),
        api.getMySellerProducts(token),
      ]);
      setSeller(sellerData);
      setProducts(productsData.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [token]); // eslint-disable-line

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !seller) return;
    setSaving(true); setErr('');
    try {
      const dto = {
        slug: form.slug, ownerType: 'seller' as const, sellerId: seller.id,
        title: form.title, description: form.description, type: form.type,
        price: parseInt(form.price, 10),
        ...(form.subtitle ? { subtitle: form.subtitle } : {}),
        ...(form.memberPrice ? { memberPrice: parseInt(form.memberPrice, 10) } : {}),
        ...(form.downloadUrl ? { downloadUrl: form.downloadUrl } : {}),
        ...(form.stock ? { stock: parseInt(form.stock, 10) } : {}),
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        ...(form.badgeLabel ? { badgeLabel: form.badgeLabel } : {}),
        status: form.status,
      };
      if (editId) {
        await fetch(`${API_URL}/api/v1/store/seller/me/products/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(dto),
        });
      } else {
        await fetch(`${API_URL}/api/v1/store/seller/me/products`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(dto),
        });
      }
      setShowForm(false); setEditId(null);
      void load();
    } catch (er) { setErr(er instanceof Error ? er.message : 'Hata'); }
    finally { setSaving(false); }
  }

  async function deleteProduct(id: string) {
    if (!token || !confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    await fetch(`${API_URL}/api/v1/store/seller/me/products/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    void load();
  }

  const inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100';

  if (!seller) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-500 dark:text-slate-400">Ürün yönetimi için onaylı satıcı hesabı gerekli.</p>
      <a href="/magazam" className="inline-block mt-4 text-sm text-[#26496b] dark:text-blue-400 hover:underline">Satıcı paneline git →</a>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl my-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-bold text-gray-900 dark:text-slate-100">{editId ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Slug *</label>
                  <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="urun-adi" /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Tür *</label>
                  <select required className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'digital' | 'physical' | 'app' }))}>
                    <option value="digital">Dijital</option>
                    <option value="physical">Fiziksel</option>
                    <option value="app">Uygulama</option>
                  </select></div>
              </div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Başlık *</label>
                <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Açıklama *</label>
                <textarea required rows={3} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Fiyat (kuruş) *</label>
                  <input required type="number" min="0" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4900 = 49TL" /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Durum</label>
                  <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'active' }))}>
                    <option value="draft">Taslak (admin onayı bekler)</option>
                    <option value="active">Aktif</option>
                  </select></div>
              </div>
              {form.type === 'digital' && (
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">İndirme URL</label>
                  <input className={inp} value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))} /></div>
              )}
              {form.type === 'physical' && (
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Stok</label>
                  <input type="number" min="0" className={inp} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              )}
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Etiketler (virgülle)</label>
                <input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} /></div>
              {err && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{err}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 dark:border-slate-700 rounded-xl">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Ürünlerim</h1>
        <button onClick={() => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
          + Yeni Ürün
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
          Henüz ürün eklemediniz.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {p.status === 'active' ? 'Aktif' : 'Taslak'}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{p.type}</span>
                </div>
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{fmt(p.price)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setForm({ slug: p.slug, title: p.title, subtitle: p.subtitle ?? '', description: p.description, type: p.type, price: String(p.price), memberPrice: p.memberPrice ? String(p.memberPrice) : '', downloadUrl: p.downloadUrl ?? '', stock: p.stock !== null ? String(p.stock) : '', tags: p.tags.join(', '), badgeLabel: p.badgeLabel ?? '', status: p.status === 'draft' ? 'draft' : 'active' }); setEditId(p.id); setShowForm(true); }}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => void deleteProduct(p.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
