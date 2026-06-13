'use client';

import { useEffect, useState } from 'react';
import {
  adminApi,
  type ContentRequestItem,
  type StoreSeller,
  type StoreProduct,
  type StoreOrder,
  type StoreOrderItem,
  type StoreCoupon,
  type StoreAnalytics,
  type StoreAdvancedAnalytics,
  type StoreReview,
  type StoreGiftCard,
  type StoreReturn,
  type StoreShipment,
  type StoreSubscription,
  type StorePayoutSummaryItem,
  type SellerPayout,
  type StoreCollection,
  type StoreInvoice,
} from '@/lib/api';
import { STATUS_CLS as STATUS_COLORS, SOURCE_LABELS, SOURCE_COLORS } from '@/lib/ui';

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };

const SELLER_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi', suspended: 'Askıya Alındı',
};
const SELLER_STATUS_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

const PRODUCT_TYPE_LABELS: Record<string, string> = { digital: 'Dijital', physical: 'Fiziksel', app: 'Uygulama' };
const PRODUCT_TYPE_CLS: Record<string, string> = {
  digital: 'bg-blue-100 text-blue-700',
  physical: 'bg-amber-100 text-amber-700',
  app: 'bg-purple-100 text-purple-700',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', processing: 'Hazırlanıyor', partially_shipped: 'Kısm. Kargoda',
  shipped: 'Kargoda', delivered: 'Teslim', cancelled: 'İptal', refunded: 'İade',
};
const ORDER_PAYMENT_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const SOURCE_GRADS: Record<string, string> = {
  sahne: 'linear-gradient(135deg,#26496b,#1e3a56)',
  mutfak: 'linear-gradient(135deg,#66aca9,#4d8f8c)',
};

type Tab = 'talepler' | 'saticilar' | 'urunler' | 'siparisler' | 'kuponlar' | 'yorumlar' | 'hediyeler' | 'analitik' | 'pazarlama' | 'iade' | 'kargo' | 'abonelik' | 'b2b' | 'odemeler' | 'koleksiyonlar' | 'faturalar';

function fmt(kurus: number) {
  return `${(kurus / 100).toFixed(2)} TL`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IcoTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg className="w-4 h-4 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// ─── Satıcılar Tab ────────────────────────────────────────────────────────────

function SaticilarTab() {
  const [sellers, setSellers] = useState<StoreSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    adminApi.listStoreSellers(statusFilter || undefined)
      .then(setSellers).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected' | 'suspended') {
    setReviewing(id);
    try {
      const dto: { status: 'approved' | 'rejected' | 'suspended'; adminNotes?: string; commissionRate?: number; iyzicоSubMerchantKey?: string } = { status };
      const notes = editForm[`${id}_notes`]; if (notes) dto.adminNotes = notes;
      const comm = editForm[`${id}_commission`]; if (comm) dto.commissionRate = parseFloat(comm);
      const key = editForm[`${id}_key`]; if (key) dto.iyzicоSubMerchantKey = key;
      await adminApi.reviewStoreSeller(id, dto);
      load();
    } finally { setReviewing(null); }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white';
  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(SELLER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-sm text-gray-400">{sellers.length} satıcı</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : sellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Satıcı bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {sellers.map(seller => {
            const isOpen = expanded === seller.id;
            return (
              <div key={seller.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0 text-[#26496b] text-sm font-bold">
                    {seller.applicantName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${SELLER_STATUS_CLS[seller.status] ?? ''}`}>
                        {SELLER_STATUS_LABELS[seller.status]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {seller.businessType === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {seller.appliedFrom === 'mutfak' ? 'Mutfak üyesi' : 'Sahne başvurusu'}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{seller.applicantName}</p>
                    <p className="text-xs text-gray-400">{seller.email} · {new Date(seller.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : seller.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                    <IcoChevron open={isOpen} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {seller.phone && <div><span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Telefon</span>{seller.phone}</div>}
                      {seller.businessName && <div><span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Kurum</span>{seller.businessName}</div>}
                      {seller.taxNumber && <div><span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Vergi No</span>{seller.taxNumber}</div>}
                      {seller.iban && <div className="col-span-2"><span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">IBAN</span>{seller.iban}</div>}
                      {seller.commissionRate && <div><span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-0.5">Komisyon</span>%{(parseFloat(seller.commissionRate) * 100).toFixed(1)}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Ne satmak istiyor?</span>
                      <p className="text-sm text-gray-700">{seller.productDescription}</p>
                    </div>

                    {seller.status === 'pending' && (
                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Komisyon Oranı (0.10 = %10)</label>
                            <input type="number" step="0.01" min="0" max="1" className={inp} placeholder="0.10"
                              value={editForm[`${seller.id}_commission`] ?? ''}
                              onChange={e => setEditForm(f => ({ ...f, [`${seller.id}_commission`]: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">iyzico Sub-Merchant Key</label>
                            <input className={inp} placeholder="Opsiyonel"
                              value={editForm[`${seller.id}_key`] ?? ''}
                              onChange={e => setEditForm(f => ({ ...f, [`${seller.id}_key`]: e.target.value }))} />
                          </div>
                        </div>
                        <textarea rows={2} className={inp} placeholder="Admin notu (opsiyonel)…"
                          value={editForm[`${seller.id}_notes`] ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, [`${seller.id}_notes`]: e.target.value }))} />
                        <div className="flex gap-2">
                          <button disabled={reviewing === seller.id} onClick={() => void review(seller.id, 'approved')}
                            className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✓ Onayla</button>
                          <button disabled={reviewing === seller.id} onClick={() => void review(seller.id, 'rejected')}
                            className="px-4 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">✕ Reddet</button>
                        </div>
                      </div>
                    )}
                    {seller.adminNotes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                        <span className="font-semibold">Admin Notu: </span>{seller.adminNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Varyant Stok Editörü ─────────────────────────────────────────────────────

function VariantStockEditor({ productId, variants }: { productId: string; variants: Array<{ name: string; values: string }> }) {
  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/store/products/${productId}/variant-stocks`, {
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : ''}` },
    }).then(r => r.json()).then(d => setStocks(d as Record<string, number>)).catch(() => {}).finally(() => setLoading(false));
  }, [productId]); // eslint-disable-line

  function parseVariantCombos(): string[] {
    if (!variants.length) return [];
    const lists = variants.map(v => v.values.split(',').map(s => s.trim()).filter(Boolean));
    let combos = [''];
    for (const list of lists) {
      combos = combos.flatMap(c => list.map(v => c ? `${c}|${v}` : v));
    }
    return combos;
  }

  async function save() {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? '' : '';
      const combos = parseVariantCombos();
      const stocksArr = combos.map(combo => {
        const pairs = combo.split('|');
        const variantsObj: Record<string, string> = {};
        variants.forEach((v, i) => { if (pairs[i]) variantsObj[v.name] = pairs[i]!; });
        return { variants: variantsObj, stock: stocks[combo] ?? 0 };
      });
      await fetch(`${API_URL}/api/v1/store/admin/products/${productId}/variant-stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stocks: stocksArr }),
      });
    } finally { setSaving(false); }
  }

  const combos = parseVariantCombos();
  if (loading || !combos.length) return null;

  return (
    <div className="space-y-2">
      {combos.map(combo => (
        <div key={combo} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-40 truncate">{combo.replace(/\|/g, ' / ')}</span>
          <input type="number" min="0" value={stocks[combo] ?? 0}
            onChange={e => setStocks(s => ({ ...s, [combo]: parseInt(e.target.value, 10) || 0 }))}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]" />
        </div>
      ))}
      <button type="button" disabled={saving} onClick={() => void save()}
        className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
        {saving ? 'Kaydediliyor…' : 'Stokları Kaydet'}
      </button>
    </div>
  );
}

// ─── Ürünler Tab ──────────────────────────────────────────────────────────────

type VariantDraft = { name: string; values: string; priceModifier: string };

const EMPTY_PRODUCT = {
  slug: '', ownerType: 'vakif' as 'vakif' | 'seller', sellerId: '',
  title: '', subtitle: '', description: '', type: 'digital' as 'digital' | 'physical' | 'app',
  price: '', memberPrice: '', images: '', downloadUrl: '', stock: '',
  tags: '', badgeLabel: '', badgeColor: 'bg-blue-100 text-blue-700', status: 'active' as 'draft' | 'active', sortOrder: '0',
  variants: [] as VariantDraft[],
};

function UrunlerTab() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    adminApi.listAdminStoreProducts(Object.keys(params).length ? params : undefined)
      .then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [typeFilter, statusFilter]); // eslint-disable-line

  function openCreate() { setForm({ ...EMPTY_PRODUCT }); setEditId(null); setSaveErr(''); setShowForm(true); }
  function openEdit(p: StoreProduct) {
    setForm({
      slug: p.slug, ownerType: p.ownerType, sellerId: p.sellerId ?? '',
      title: p.title, subtitle: p.subtitle ?? '', description: p.description,
      type: p.type, price: String(p.price), memberPrice: p.memberPrice ? String(p.memberPrice) : '',
      images: p.images.join('\n'), downloadUrl: p.downloadUrl ?? '', stock: p.stock !== null ? String(p.stock) : '',
      tags: p.tags.join(', '), badgeLabel: p.badgeLabel ?? '', badgeColor: p.badgeColor ?? '',
      status: p.status === 'draft' ? 'draft' : 'active', sortOrder: String(p.sortOrder),
      variants: (p.variants ?? []).map(v => ({ name: v.name, values: v.values.join(', '), priceModifier: v.priceModifier ? String(v.priceModifier) : '' })),
    });
    setEditId(p.id);
    setSaveErr('');
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveErr('');
    try {
      const dto: Parameters<typeof adminApi.createStoreProduct>[0] = {
        slug: form.slug, ownerType: form.ownerType,
        title: form.title,
        description: form.description, type: form.type,
        price: parseInt(form.price, 10),
        images: form.images ? form.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        status: form.status as 'draft' | 'active',
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      if (form.sellerId) dto.sellerId = form.sellerId;
      if (form.subtitle) dto.subtitle = form.subtitle;
      if (form.memberPrice) dto.memberPrice = parseInt(form.memberPrice, 10);
      if (form.downloadUrl) dto.downloadUrl = form.downloadUrl;
      if (form.stock) dto.stock = parseInt(form.stock, 10);
      if (form.badgeLabel) dto.badgeLabel = form.badgeLabel;
      if (form.badgeColor) dto.badgeColor = form.badgeColor;
      if (form.variants.length > 0) {
        (dto as Record<string, unknown>).variants = form.variants
          .filter(v => v.name && v.values)
          .map(v => ({
            name: v.name,
            values: v.values.split(',').map(s => s.trim()).filter(Boolean),
            ...(v.priceModifier ? { priceModifier: parseInt(v.priceModifier, 10) } : {}),
          }));
      }
      if (editId) { await adminApi.updateStoreProduct(editId, dto); }
      else { await adminApi.createStoreProduct(dto); }
      setShowForm(false);
      load();
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Hata oluştu');
    } finally { setSaving(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try { await adminApi.deleteStoreProduct(id); load(); }
    finally { setDeleting(null); }
  }

  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Slug *</label>
                  <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="harita-terimleri-sozlugu" /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Tür *</label>
                  <select required className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'digital' | 'physical' | 'app' }))}>
                    <option value="digital">Dijital</option>
                    <option value="physical">Fiziksel</option>
                    <option value="app">Uygulama</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Sahip *</label>
                  <select required className={inp} value={form.ownerType} onChange={e => setForm(f => ({ ...f, ownerType: e.target.value as 'vakif' | 'seller' }))}>
                    <option value="vakif">Vakıf</option>
                    <option value="seller">Satıcı</option>
                  </select></div>
                {form.ownerType === 'seller' && (
                  <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Satıcı ID</label>
                    <input className={inp} value={form.sellerId} onChange={e => setForm(f => ({ ...f, sellerId: e.target.value }))} /></div>
                )}
              </div>
              <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Başlık *</label>
                <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Alt Başlık</label>
                <input className={inp} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Açıklama *</label>
                <textarea required rows={3} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Fiyat (kuruş) *</label>
                  <input required type="number" min="0" className={inp} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4900 = 49 TL" /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Üye Fiyatı (kuruş)</label>
                  <input type="number" min="0" className={inp} value={form.memberPrice} onChange={e => setForm(f => ({ ...f, memberPrice: e.target.value }))} placeholder="2900 = 29 TL" /></div>
              </div>
              {form.type === 'digital' && (
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">İndirme URL</label>
                  <input className={inp} value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))} /></div>
              )}
              {form.type === 'physical' && (
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Stok</label>
                  <input type="number" min="0" className={inp} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Görseller</label>
                <div className="flex gap-2 mb-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#26496b] border border-[#26496b]/30 rounded-lg hover:bg-[#26496b]/5 cursor-pointer transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Görsel Yükle
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const result = await adminApi.uploadFile(file);
                        setForm(f => ({ ...f, images: f.images ? `${f.images}\n${result.url}` : result.url }));
                      } catch { /* ignore */ }
                      e.target.value = '';
                    }} />
                  </label>
                  <span className="text-xs text-gray-400 self-center">veya URL yapıştır</span>
                </div>
                <textarea rows={2} className={inp} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="Her satıra 1 URL" />
                {form.images && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.split('\n').map(u => u.trim()).filter(Boolean).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ))}
                  </div>
                )}
              </div>
              <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Etiketler (virgülle)</label>
                <input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="PDF, 130 sayfa, Türkçe" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Badge Etiketi</label>
                  <input className={inp} value={form.badgeLabel} onChange={e => setForm(f => ({ ...f, badgeLabel: e.target.value }))} placeholder="Dijital İndirme" /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Sıralama</label>
                  <input type="number" className={inp} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
              </div>
              {/* Varyantlar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Varyantlar (ör. Beden, Renk)</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { name: '', values: '', priceModifier: '' }] }))}
                    className="text-xs text-[#26496b] font-semibold hover:underline">+ Ekle</button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input className={inp} placeholder="Beden" value={v.name} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv, ii) => ii === i ? { ...vv, name: e.target.value } : vv) }))} />
                    <input className={inp} placeholder="S, M, L, XL" value={v.values} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv, ii) => ii === i ? { ...vv, values: e.target.value } : vv) }))} />
                    <div className="flex gap-1">
                      <input type="number" className={inp} placeholder="+fiyat" value={v.priceModifier} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((vv, ii) => ii === i ? { ...vv, priceModifier: e.target.value } : vv) }))} />
                      <button type="button" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, ii) => ii !== i) }))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Durum</label>
                  <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'active' }))}>
                    <option value="active">Aktif</option>
                    <option value="draft">Taslak</option>
                  </select></div>
              </div>
              {/* Varyant Bazlı Stok */}
              {form.variants.length > 0 && editId && (
                <div className="border-t border-gray-100 pt-3">
                  <label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-2">Varyant Bazlı Stok</label>
                  <VariantStockEditor productId={editId} variants={form.variants} />
                </div>
              )}
              {saveErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveErr}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select className={sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tüm Türler</option>
            <option value="digital">Dijital</option>
            <option value="physical">Fiziksel</option>
            <option value="app">Uygulama</option>
          </select>
          <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="draft">Taslak</option>
            <option value="paused">Duraklatıldı</option>
            <option value="archived">Arşiv</option>
          </select>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] transition-colors">
          <IcoPlus /> Yeni Ürün
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Ürün bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3.5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 text-lg font-bold">
                {p.type === 'digital' ? '📄' : p.type === 'app' ? '📱' : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRODUCT_TYPE_CLS[p.type] ?? ''}`}>
                    {PRODUCT_TYPE_LABELS[p.type]}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? 'Aktif' : p.status === 'draft' ? 'Taslak' : p.status}
                  </span>
                  <span className="text-[10px] text-gray-400">{p.ownerType === 'vakif' ? 'Vakıf' : 'Satıcı'}</span>
                </div>
                <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400">{(p.price / 100).toFixed(0)} TL {p.memberPrice ? `· Üye: ${(p.memberPrice / 100).toFixed(0)} TL` : ''}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button title="Düzenle" onClick={() => openEdit(p)}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors">
                  <IcoEdit />
                </button>
                <button title="Sil" disabled={deleting === p.id} onClick={() => void deleteProduct(p.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                  <IcoTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Siparişler Tab ───────────────────────────────────────────────────────────

function SiparislerTab() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, StoreOrderItem[]>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    adminApi.listAdminStoreOrders(Object.keys(params).length ? params : undefined)
      .then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  async function expandOrder(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!orderItems[id]) {
      const order = await adminApi.getStoreOrder(id);
      setOrderItems(prev => ({ ...prev, [id]: order.items }));
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    setUpdating(id);
    try { await adminApi.updateStoreOrderStatus(id, status); load(); }
    finally { setUpdating(null); }
  }

  async function updateItemShipping(itemId: string, orderId: string) {
    setUpdating(itemId);
    try {
      await adminApi.updateStoreItemShipping(itemId, {
        shippingStatus: (trackingForm[`${itemId}_status`] ?? 'preparing') as 'preparing' | 'shipped' | 'delivered',
        ...(trackingForm[`${itemId}_num`] ? { trackingNumber: trackingForm[`${itemId}_num`] } : {}),
        ...(trackingForm[`${itemId}_co`] ? { trackingCompany: trackingForm[`${itemId}_co`] } : {}),
      });
      const order = await adminApi.getStoreOrder(orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: order.items }));
    } finally { setUpdating(null); }
  }

  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-sm text-gray-400">{orders.length} sipariş</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Sipariş bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => {
            const isOpen = expanded === order.id;
            const items = orderItems[order.id] ?? [];
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ORDER_PAYMENT_CLS[order.paymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                        Ödeme: {order.paymentStatus}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{order.buyerName}</p>
                    <p className="text-xs text-gray-400">{order.buyerEmail} · {fmt(order.total)} · {new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {order.status === 'processing' && (
                      <button disabled={updating === order.id} onClick={() => void updateOrderStatus(order.id, 'shipped')}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        Kargoya Ver
                      </button>
                    )}
                    <button onClick={() => void expandOrder(order.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                      <IcoChevron open={isOpen} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                    {order.shippingAddress && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Kargo Adresi</p>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(order.shippingAddress, null, 2)}</pre>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Kalemler</p>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item.productSnapshot.title}</p>
                                <p className="text-xs text-gray-400">{fmt(item.unitPrice)} · {item.quantity} adet · {item.productSnapshot.ownerType === 'seller' ? 'Satıcı ürünü' : 'Vakıf ürünü'}</p>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.shippingStatus === 'delivered' ? 'bg-green-100 text-green-700' : item.shippingStatus === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                {item.shippingStatus}
                              </span>
                            </div>
                            {item.productSnapshot.type === 'physical' && item.shippingStatus !== 'delivered' && (
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                                <select className={sel} value={trackingForm[`${item.id}_status`] ?? 'preparing'}
                                  onChange={e => setTrackingForm(f => ({ ...f, [`${item.id}_status`]: e.target.value }))}>
                                  <option value="preparing">Hazırlanıyor</option>
                                  <option value="shipped">Kargoda</option>
                                  <option value="delivered">Teslim</option>
                                </select>
                                <input className={inp} placeholder="Takip no"
                                  value={trackingForm[`${item.id}_num`] ?? ''}
                                  onChange={e => setTrackingForm(f => ({ ...f, [`${item.id}_num`]: e.target.value }))} />
                                <button disabled={updating === item.id} onClick={() => void updateItemShipping(item.id, order.id)}
                                  className="px-3 py-2 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                                  Güncelle
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Content Requests (Mağaza Talepleri) ─────────────────────────────────────

function TaleplerTab() {
  const [requests, setRequests] = useState<ContentRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deletingReq, setDeletingReq] = useState<string | null>(null);

  const STATUS_LABELS_REQ: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };
  const sel = 'border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30';
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white';

  function loadRequests() {
    setReqLoading(true);
    const qs: Record<string, string> = { type: 'magaza' };
    if (statusFilter) qs.status = statusFilter;
    if (sourceFilter) qs.source = sourceFilter;
    adminApi.listContentRequests(qs)
      .then(r => setRequests(r.data)).catch(() => {}).finally(() => setReqLoading(false));
  }

  useEffect(() => { loadRequests(); }, [statusFilter, sourceFilter]); // eslint-disable-line

  async function review(id: string, status: 'approved' | 'rejected') {
    setReviewing(id);
    try { await adminApi.reviewContentRequest(id, status, notes[id]); loadRequests(); }
    finally { setReviewing(null); }
  }

  async function deleteReq(id: string) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    setDeletingReq(id);
    try { await adminApi.deleteContentRequest(id); loadRequests(); }
    finally { setDeletingReq(null); }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {(['', 'sahne', 'mutfak'] as const).map(s => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors ${sourceFilter === s ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b] hover:text-[#26496b]'}`}>
              {s === '' ? 'Tümü' : s === 'sahne' ? 'Sahne' : 'Mutfak'}
            </button>
          ))}
        </div>
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS_REQ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {reqLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Mağaza talebi bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {requests.map(item => {
            const isOpen = expandedReq === item.id;
            const grad = SOURCE_GRADS[item.source] ?? 'linear-gradient(135deg,#64748b,#475569)';
            const initials = (item.displayName ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: grad }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[item.status] ?? ''}`}>{STATUS_LABELS_REQ[item.status] ?? item.status}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'}`}>{SOURCE_LABELS[item.source] ?? item.source}</span>
                      <span className="text-[10px] text-gray-400">{item.displayName} · {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button title="Sil" disabled={deletingReq === item.id} onClick={() => void deleteReq(item.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <IcoTrash />
                    </button>
                    <button onClick={() => setExpandedReq(isOpen ? null : item.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                      <IcoChevron open={isOpen} />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/60 space-y-3">
                    <p className="text-sm text-gray-700">{item.description}</p>
                    {item.contactInfo && <p className="text-xs text-gray-500"><strong>İletişim:</strong> {item.contactInfo}</p>}
                    {item.status === 'pending' && (
                      <div className="space-y-2 pt-1">
                        <textarea rows={2} value={notes[item.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                          className={inp} placeholder="Onay/red gerekçesi (opsiyonel)…" />
                        <div className="flex gap-2">
                          <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'approved')}
                            className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✓ Onayla</button>
                          <button disabled={reviewing === item.id} onClick={() => void review(item.id, 'rejected')}
                            className="px-4 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">✕ Reddet</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analitik Tab ─────────────────────────────────────────────────────────────

function AnalitikTab() {
  const [data, setData] = useState<StoreAnalytics | null>(null);
  const [advanced, setAdvanced] = useState<StoreAdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getStoreAnalytics(parseInt(period, 10)),
      adminApi.getAdvancedAnalytics(parseInt(period, 10)),
    ]).then(([basic, adv]) => { setData(basic); setAdvanced(adv); }).catch(() => {}).finally(() => setLoading(false));
  }, [period]); // eslint-disable-line

  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none';

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select className={sel} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Son 7 gün</option>
          <option value="30">Son 30 gün</option>
          <option value="90">Son 90 gün</option>
        </select>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Gelir', value: data ? `${(data.totalRevenue / 100).toFixed(2)} TL` : '—' },
          { label: 'Sipariş Sayısı', value: data?.totalOrders ?? 0 },
          { label: 'Ortalama Sipariş', value: data ? `${(data.avgOrderValue / 100).toFixed(2)} TL` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Günlük trend */}
      {data && data.dailyTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Günlük Sipariş Trendi</p>
          <div className="flex items-end gap-1 h-32">
            {data.dailyTrend.map(d => {
              const maxOrders = Math.max(...data.dailyTrend.map(x => x.orders), 1);
              const pct = (d.orders / maxOrders) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#26496b] rounded-t" style={{ height: `${pct}%`, minHeight: d.orders > 0 ? '4px' : '0' }} title={`${d.day}: ${d.orders} sipariş`} />
                  <span className="text-[9px] text-gray-400 rotate-45 origin-left truncate">{d.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* İleri analytics */}
      {advanced && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Ort. Müşteri LTV', value: `${(advanced.avgLTV / 100).toFixed(2)} TL` },
            { label: 'Dönüşüm Oranı', value: `%${advanced.conversionRate}` },
            { label: 'Tekrar Alıcı', value: advanced.repeatBuyers },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-end gap-0.5 h-12 mb-1">
              {advanced.salesByDay.map(d => {
                const max = Math.max(...advanced.salesByDay.map(x => x.count), 1);
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full bg-[#26496b]/70 rounded-sm" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? '2px' : '0' }} title={`${d.label}: ${d.count}`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-gray-400">
              {advanced.salesByDay.map(d => <span key={d.label}>{d.label}</span>)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Günlük Dağılım</p>
          </div>
        </div>
      )}

      {advanced?.topCustomers && advanced.topCustomers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">En Değerli Müşteriler</p>
          <div className="space-y-2">
            {advanced.topCustomers.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 font-mono text-xs">{c.email}</span>
                <span className="text-gray-500 ml-2 shrink-0 font-semibold">{(c.total / 100).toFixed(2)} TL</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En çok satılanlar */}
      {data && data.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">En Çok Satılan Ürünler</p>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate flex-1">{p.title}</span>
                <span className="text-gray-400 ml-2 shrink-0">{p.quantity} adet · {(p.revenue / 100).toFixed(0)} TL</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Yorumlar Tab ─────────────────────────────────────────────────────────────

function YorumlarTab() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<boolean | undefined>(undefined);

  function load() {
    setLoading(true);
    adminApi.listAdminReviews(filter).then(setReviews).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {([['Tümü', undefined], ['Yayında', true], ['Bekliyor', false]] as [string, boolean | undefined][]).map(([l, v]) => (
          <button key={l} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${filter === v ? 'bg-[#26496b] text-white border-[#26496b]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]'}`}>
            {l}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
        : reviews.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">Yorum bulunamadı.</div>
        : (
          <div className="space-y-2">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${r.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.isPublished ? 'Yayında' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{r.buyerName}</p>
                  {r.comment && <p className="text-xs text-gray-500 mt-0.5">{r.comment}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => void adminApi.publishReview(r.id, !r.isPublished).then(() => load())}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${r.isPublished ? 'text-gray-600 border border-gray-200 hover:bg-gray-50' : 'text-green-700 border border-green-200 hover:bg-green-50'}`}>
                    {r.isPublished ? 'Gizle' : 'Yayınla'}
                  </button>
                  <button onClick={() => void adminApi.deleteReview(r.id).then(() => load())}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <IcoTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Hediye Kartları Tab ──────────────────────────────────────────────────────

function HediyelerTab() {
  const [cards, setCards] = useState<StoreGiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ purchasedByEmail: '', recipientEmail: '', recipientName: '', amount: '', message: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  function load() { setLoading(true); adminApi.listGiftCards().then(setCards).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveErr('');
    try {
      await adminApi.createGiftCard({
        purchasedByEmail: form.purchasedByEmail, recipientEmail: form.recipientEmail,
        recipientName: form.recipientName, amount: parseInt(form.amount, 10) * 100,
        ...(form.message ? { message: form.message } : {}),
        ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
      });
      setShowForm(false); load();
    } catch (err) { setSaveErr(err instanceof Error ? err.message : 'Hata'); }
    finally { setSaving(false); }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Hediye Kartı Oluştur</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="px-5 py-4 space-y-3">
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Gönderenin E-postası *</label>
                <input required type="email" className={inp} value={form.purchasedByEmail} onChange={e => setForm(f => ({ ...f, purchasedByEmail: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Alıcı Adı *</label>
                  <input required className={inp} value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Alıcı E-posta *</label>
                  <input required type="email" className={inp} value={form.recipientEmail} onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Tutar (TL) *</label>
                  <input required type="number" min="1" className={inp} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="50" /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Son Tarih</label>
                  <input type="date" className={inp} value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
              </div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Kişisel Mesaj</label>
                <textarea rows={2} className={inp} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
              {saveErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveErr}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg disabled:opacity-50">
                  {saving ? 'Oluşturuluyor…' : 'Oluştur & Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
          <IcoPlus /> Hediye Kartı
        </button>
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
        : cards.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">Henüz hediye kartı yok.</div>
        : (
          <div className="space-y-2">
            {cards.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className="text-2xl">🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-gray-900">{c.code}</p>
                  <p className="text-xs text-gray-400">
                    {c.recipientName} ({c.recipientEmail}) · Bakiye: {(c.balance / 100).toFixed(2)} TL / {(c.originalAmount / 100).toFixed(2)} TL
                    {c.expiresAt ? ` · ${new Date(c.expiresAt).toLocaleDateString('tr-TR')} kadar` : ''}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Pazarlama Tab ────────────────────────────────────────────────────────────

function PazarlamaTab() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [err, setErr] = useState('');

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  async function send(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setErr(''); setResult(null);
    try {
      const r = await adminApi.sendStoreCampaign({ subject, body, targetType: 'all_buyers' });
      setResult(r);
    } catch (er) { setErr(er instanceof Error ? er.message : 'Hata'); }
    finally { setSending(false); }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500 mb-6">Tüm alıcılara (ödeme yapmış müşterilere) kampanya e-postası gönderin.</p>
      <form onSubmit={(e) => void send(e)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Konu *</label>
          <input required className={inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Haritailesi Mağaza — Yeni Ürünler!" /></div>
        <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">İçerik *</label>
          <textarea required rows={8} className={inp} value={body} onChange={e => setBody(e.target.value)} placeholder="Kampanya içeriğini buraya yazın…" /></div>
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        {result && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">✓ {result.sent} alıcıya gönderildi.</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={sending || !subject || !body}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
            {sending ? 'Gönderiliyor…' : 'Kampanyayı Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── İade Tab ─────────────────────────────────────────────────────────────────

function IadeTab() {
  const [returns, setReturns] = useState<StoreReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [resolving, setResolving] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processRefund, setProcessRefund] = useState<Record<string, boolean>>({});

  function load() { setLoading(true); adminApi.listReturns(statusFilter || undefined).then(setReturns).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  async function resolve(id: string, status: 'approved' | 'rejected' | 'completed') {
    setResolving(id);
    try {
      const dto: Parameters<typeof adminApi.resolveReturn>[1] = { status, restockItems: true };
      const n = notes[id]; if (n) dto.adminNotes = n;
      if (status === 'completed') dto.processRefund = processRefund[id] !== false;
      await adminApi.resolveReturn(id, dto); load();
    }
    finally { setResolving(null); }
  }

  const STATUS_LABELS = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi', completed: 'Tamamlandı' };
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white';
  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tümü</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-sm text-gray-400">{returns.length} iade talebi</span>
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
        : returns.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">İade talebi yok.</div>
        : (
          <div className="space-y-3">
            {returns.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.buyerEmail}</p>
                    <p className="text-xs text-gray-400">Sipariş: {r.orderId.slice(-8).toUpperCase()} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                    <p className="text-sm text-gray-700 mt-1">{r.reason}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <textarea rows={2} className={inp} placeholder="Admin notu…" value={notes[r.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <button disabled={resolving === r.id} onClick={() => void resolve(r.id, 'approved')} className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✓ Onayla</button>
                      <button disabled={resolving === r.id} onClick={() => void resolve(r.id, 'rejected')} className="px-3 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">✕ Reddet</button>
                    </div>
                  </div>
                )}
                {r.status === 'approved' && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={processRefund[r.id] !== false} onChange={e => setProcessRefund(p => ({ ...p, [r.id]: e.target.checked }))} className="rounded" />
                      iyzico üzerinden otomatik para iadesi yap
                    </label>
                    <textarea rows={2} className={inp} placeholder="Tamamlama notu…" value={notes[r.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} />
                    <button disabled={resolving === r.id} onClick={() => void resolve(r.id, 'completed')}
                      className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      ✓ Tamamla & İade Et
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Kargo Tab ────────────────────────────────────────────────────────────────

function KargoTab() {
  const [orderId, setOrderId] = useState('');
  const [provider, setProvider] = useState<'yurtici' | 'mng' | 'ptt'>('yurtici');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ trackingNumber: string } | null>(null);
  const [err, setErr] = useState('');
  const [weightGrams, setWeightGrams] = useState('1000');
  const [city, setCity] = useState('İstanbul');
  const [rates, setRates] = useState<Array<{ provider: string; cost: number; estimatedDays: number }>>([]);
  const [calculating, setCalculating] = useState(false);

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';
  const sel = inp;

  async function calculate() {
    setCalculating(true);
    try { const r = await adminApi.calculateShipping(parseInt(weightGrams, 10), city); setRates(r); }
    finally { setCalculating(false); }
  }

  async function createShipment(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setErr(''); setResult(null);
    try { const r = await adminApi.createShipment(orderId, provider); setResult(r); }
    catch (er) { setErr(er instanceof Error ? er.message : 'Hata'); }
    finally { setCreating(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Ücret Hesabı */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Kargo Ücreti Hesapla</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Ağırlık (gram)</label>
            <input type="number" className={inp} value={weightGrams} onChange={e => setWeightGrams(e.target.value)} /></div>
          <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Şehir</label>
            <input className={inp} value={city} onChange={e => setCity(e.target.value)} /></div>
        </div>
        <button disabled={calculating} onClick={() => void calculate()} className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50">
          {calculating ? 'Hesaplanıyor…' : 'Hesapla'}
        </button>
        {rates.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {rates.map(r => (
              <div key={r.provider} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium capitalize">{r.provider}</span>
                <span>{(r.cost / 100).toFixed(2)} TL · {r.estimatedDays} gün</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gönderi Oluştur */}
      <form onSubmit={(e) => void createShipment(e)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-900">Kargo Gönderisi Oluştur</p>
        <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Sipariş ID *</label>
          <input required className={inp} value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
        <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Kargo Firması</label>
          <select className={sel} value={provider} onChange={e => setProvider(e.target.value as 'yurtici' | 'mng' | 'ptt')}>
            <option value="yurtici">Yurtiçi Kargo</option>
            <option value="mng">MNG Kargo</option>
            <option value="ptt">PTT Kargo</option>
          </select></div>
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        {result && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg font-mono">✓ Takip No: {result.trackingNumber}</p>}
        <button type="submit" disabled={creating} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50">
          {creating ? 'Oluşturuluyor…' : 'Gönderi Oluştur'}
        </button>
      </form>
    </div>
  );
}

// ─── Abonelik Tab ─────────────────────────────────────────────────────────────

function AbonelikTab() {
  const [subs, setSubs] = useState<StoreSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.listAdminSubscriptions(statusFilter || undefined).then(setSubs).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]); // eslint-disable-line

  const STATUS_LABELS = { active: 'Aktif', paused: 'Duraklatıldı', cancelled: 'İptal', past_due: 'Gecikmiş' };
  const STATUS_CLS: Record<string, string> = { active: 'bg-green-100 text-green-700', paused: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700', past_due: 'bg-amber-100 text-amber-700' };
  const INTERVAL = { monthly: 'Aylık', quarterly: 'Üç Aylık', yearly: 'Yıllık' };
  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tümü</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-sm text-gray-400">{subs.length} abonelik</span>
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
        : subs.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">Abonelik bulunamadı.</div>
        : (
          <div className="space-y-2">
            {subs.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_CLS[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status}</span>
                    <span className="text-[10px] text-gray-400">{INTERVAL[s.interval]}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{s.buyerName} — {s.buyerEmail}</p>
                  <p className="text-xs text-gray-400">{(s.priceKurus / 100).toFixed(2)} TL · Sonraki: {s.nextBillingAt ? new Date(s.nextBillingAt).toLocaleDateString('tr-TR') : '—'}</p>
                </div>
                {s.status === 'active' && (
                  <button onClick={() => void adminApi.cancelSubscription(s.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 shrink-0">
                    İptal Et
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── B2B Tab ──────────────────────────────────────────────────────────────────

function B2bTab() {
  const [groups, setGroups] = useState<Array<{ id: string; name: string; discountPct: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [disc, setDisc] = useState('');
  const [saving, setSaving] = useState(false);
  const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  useEffect(() => { setLoading(true); adminApi.listB2bGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false)); }, []); // eslint-disable-line

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { await adminApi.createB2bGroup(name, parseInt(disc, 10)); setName(''); setDisc(''); adminApi.listB2bGroups().then(setGroups).catch(() => {}); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-gray-500">B2B fiyat grupları — kurumsal alıcılara özel fiyat indirimleri tanımlayın.</p>
      <form onSubmit={(e) => void create(e)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-3 items-end">
        <div className="flex-1"><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Grup Adı *</label>
          <input required className={`${inp} w-full`} value={name} onChange={e => setName(e.target.value)} placeholder="Kurumsal Üyeler" /></div>
        <div className="w-32"><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">İndirim % *</label>
          <input required type="number" min="0" max="100" className={`${inp} w-full`} value={disc} onChange={e => setDisc(e.target.value)} placeholder="15" /></div>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl disabled:opacity-50">Oluştur</button>
      </form>
      {!loading && (
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{g.name}</span>
              <span className="text-sm text-gray-500">%{g.discountPct} indirim</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Faturalar Tab ────────────────────────────────────────────────────────────

function FaturalarTab() {
  const [invoices, setInvoices] = useState<StoreInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminApi.listInvoices(statusFilter ? { status: statusFilter } : {})
      .then(setInvoices).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  async function retry(id: string) {
    setRetrying(id);
    try { await adminApi.retryInvoice(id); load(); }
    finally { setRetrying(null); }
  }

  const sel = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none';
  const STATUS_LABELS: Record<string, string> = { draft: 'Taslak', sent: 'Gönderildi', failed: 'Hata', cancelled: 'İptal' };
  const STATUS_CLS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select className={sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-sm text-gray-400">{invoices.length} fatura</span>
      </div>

      {/* Webhook yapılandırma uyarısı */}
      {!process.env['NEXT_PUBLIC_EFATURA_CONFIGURED'] && invoices.some(i => i.status === 'draft') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4">
          <strong>Webhook yapılandırılmamış.</strong> E-fatura göndermek için{' '}
          <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">EFATURA_WEBHOOK_URL</code> env değişkenini ekleyin.
          Taslak faturalar hazır, webhook eklenince gönderilebilir.
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          Fatura bulunamadı. Ödeme alındığında otomatik oluşturulur.
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_CLS[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {inv.invoiceType === 'e_fatura' ? 'e-Fatura' : 'e-Arşiv'}
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-gray-900">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-400">
                  {inv.buyerName} · {(inv.total / 100).toFixed(2)} TL
                  {inv.webhookSentAt ? ` · Gönderildi: ${new Date(inv.webhookSentAt).toLocaleDateString('tr-TR')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(inv.status === 'draft' || inv.status === 'failed') && (
                  <button
                    disabled={retrying === inv.id}
                    onClick={() => void retry(inv.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#26496b] border border-[#26496b]/30 rounded-lg hover:bg-[#26496b]/5 disabled:opacity-50 transition-colors"
                  >
                    {retrying === inv.id ? '…' : '↻ Yeniden Gönder'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Koleksiyonlar Tab ────────────────────────────────────────────────────────

function KoleksiyonlarTab() {
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: '', title: '', description: '', coverImage: '', productIds: '', sortOrder: '0', isActive: true });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  function load() { setLoading(true); adminApi.listCollections().then(setCollections).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []); // eslint-disable-line

  function openCreate() { setForm({ slug: '', title: '', description: '', coverImage: '', productIds: '', sortOrder: '0', isActive: true }); setEditId(null); setSaveErr(''); setShowForm(true); }
  function openEdit(c: StoreCollection) {
    setForm({ slug: c.slug, title: c.title, description: c.description ?? '', coverImage: c.coverImage ?? '', productIds: c.productIds.join(', '), sortOrder: String(c.sortOrder), isActive: c.isActive });
    setEditId(c.id); setSaveErr(''); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveErr('');
    try {
      const dto = {
        slug: form.slug, title: form.title,
        ...(form.description ? { description: form.description } : {}),
        ...(form.coverImage ? { coverImage: form.coverImage } : {}),
        productIds: form.productIds ? form.productIds.split(',').map(s => s.trim()).filter(Boolean) : [],
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
      };
      if (editId) await adminApi.updateCollection(editId, dto);
      else await adminApi.createCollection(dto);
      setShowForm(false); load();
    } catch (err) { setSaveErr(err instanceof Error ? err.message : 'Hata'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? 'Koleksiyonu Düzenle' : 'Yeni Koleksiyon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Slug *</label>
                  <input required className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="haritacilik-kitaplari" /></div>
                <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Sıralama</label>
                  <input type="number" className={inp} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
              </div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Başlık *</label>
                <input required className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Açıklama</label>
                <textarea rows={2} className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Kapak Görseli URL</label>
                <input className={inp} value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://…" /></div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Ürün ID'leri (virgülle)</label>
                <textarea rows={3} className={inp} value={form.productIds} onChange={e => setForm(f => ({ ...f, productIds: e.target.value }))} placeholder="uuid1, uuid2, …" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="col-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <label htmlFor="col-active" className="text-sm text-gray-700">Aktif</label>
              </div>
              {saveErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveErr}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg disabled:opacity-50">
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{collections.length} koleksiyon</span>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
          <IcoPlus /> Yeni Koleksiyon
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Henüz koleksiyon yok.</div>
      ) : (
        <div className="space-y-2">
          {collections.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              {c.coverImage && (
                <img src={c.coverImage} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <span className="text-[10px] text-gray-400">{c.productIds.length} ürün</span>
                </div>
                <p className="font-semibold text-sm text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-400 font-mono">/magaza/koleksiyon/{c.slug}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-[#26496b] hover:bg-[#26496b]/5 transition-colors"><IcoEdit /></button>
                <button onClick={() => { void adminApi.deleteCollection(c.id).then(() => load()); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><IcoTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ödemeler Tab ────────────────────────────────────────────────────────────

function OdemelerTab() {
  const [data, setData] = useState<{ summary: StorePayoutSummaryItem[]; payouts: SellerPayout[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    adminApi.getPayoutSummary().then(setData).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function createPayout(sellerId: string, itemIds: string[]) {
    setCreating(sellerId);
    try {
      const n = notes[`create_${sellerId}`];
      await adminApi.createPayout(sellerId, itemIds, n);
      load();
    } finally { setCreating(null); }
  }

  async function markPaid(payoutId: string) {
    setMarking(payoutId);
    try {
      const n = notes[`paid_${payoutId}`];
      await adminApi.markPayoutPaid(payoutId, n);
      load();
    } finally { setMarking(null); }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b] bg-white';

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>;

  return (
    <div className="space-y-8">
      {/* Serbest bakiyeler */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Serbest Bakiyeler (IBAN Transferi Bekleyen)</h2>
        {!data?.summary.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Bekleyen satıcı ödemesi yok.
          </div>
        ) : (
          <div className="space-y-3">
            {data.summary.map(s => (
              <div key={s.sellerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{s.sellerName}</p>
                    <p className="text-xs text-gray-400">{s.sellerEmail} · {s.itemCount} kalem</p>
                    {s.iban && (
                      <p className="font-mono text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 inline-block">
                        IBAN: {s.iban}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-green-700">{(s.releasedAmount / 100).toFixed(2)} TL</p>
                    <p className="text-[10px] text-gray-400">serbest tutar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <input
                    className={`${inp} flex-1`}
                    placeholder="Admin notu (opsiyonel)"
                    value={notes[`create_${s.sellerId}`] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [`create_${s.sellerId}`]: e.target.value }))}
                  />
                  <button
                    disabled={creating === s.sellerId}
                    onClick={() => void createPayout(s.sellerId, s.itemIds)}
                    className="shrink-0 px-4 py-2 text-xs font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50"
                  >
                    {creating === s.sellerId ? 'Oluşturuluyor…' : 'Ödeme Kaydı Oluştur'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ödeme geçmişi */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Ödeme Geçmişi</h2>
        {!data?.payouts.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Henüz ödeme kaydı yok.
          </div>
        ) : (
          <div className="space-y-2">
            {data.payouts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status === 'paid' ? 'Ödendi' : p.status === 'pending' ? 'Bekliyor' : 'İptal'}
                    </span>
                    <span className="text-[10px] text-gray-400">{p.itemIds.length} kalem · {new Date(p.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="font-bold text-sm text-gray-900">{(p.totalAmount / 100).toFixed(2)} TL</p>
                  {p.adminNotes && <p className="text-xs text-gray-400 mt-0.5">{p.adminNotes}</p>}
                  {p.paidAt && <p className="text-xs text-gray-400">Ödeme: {new Date(p.paidAt).toLocaleDateString('tr-TR')}</p>}
                </div>
                {p.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b] w-36"
                      placeholder="Not (opsiyonel)"
                      value={notes[`paid_${p.id}`] ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [`paid_${p.id}`]: e.target.value }))}
                    />
                    <button
                      disabled={marking === p.id}
                      onClick={() => void markPaid(p.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {marking === p.id ? '…' : '✓ Ödendi'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kuponlar Tab ─────────────────────────────────────────────────────────────

function KuponlarTab() {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage' as 'percentage' | 'fixed', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  function load() {
    setLoading(true);
    adminApi.listStoreCoupons().then(setCoupons).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveErr('');
    try {
      await adminApi.createStoreCoupon({
        code: form.code, discountType: form.discountType,
        discountValue: parseInt(form.discountValue, 10),
        ...(form.description ? { description: form.description } : {}),
        ...(form.minOrderAmount ? { minOrderAmount: parseInt(form.minOrderAmount, 10) } : {}),
        ...(form.maxUses ? { maxUses: parseInt(form.maxUses, 10) } : {}),
        ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
      });
      setShowForm(false);
      load();
    } catch (err) { setSaveErr(err instanceof Error ? err.message : 'Hata'); }
    finally { setSaving(false); }
  }

  async function toggle(id: string, current: boolean) {
    await adminApi.toggleStoreCoupon(id, !current);
    load();
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Yeni Kupon</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => void save(e)} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Kupon Kodu *</label>
                  <input required className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="HARITA20" /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">İndirim Tipi *</label>
                  <select required className={inp} value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}>
                    <option value="percentage">% Yüzde</option>
                    <option value="fixed">Sabit Tutar (kuruş)</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">İndirim Değeri *</label>
                  <input required type="number" min="1" className={inp} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20 = %20' : '1000 = 10TL'} /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Min. Sipariş (kuruş)</label>
                  <input type="number" min="0" className={inp} value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="5000 = 50TL" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Max Kullanım</label>
                  <input type="number" min="1" className={inp} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="100" /></div>
                <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Son Kullanım</label>
                  <input type="date" className={inp} value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
              </div>
              <div><label className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold block mb-1">Açıklama</label>
                <input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="İç not" /></div>
              {saveErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveErr}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                  {saving ? 'Oluşturuluyor…' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{coupons.length} kupon</span>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56]">
          <IcoPlus /> Yeni Kupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">Henüz kupon yok.</div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-bold text-gray-900">{c.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {c.discountType === 'percentage' ? `%${c.discountValue}` : `${(c.discountValue / 100).toFixed(2)} TL`} indirim
                  {c.minOrderAmount > 0 ? ` · Min. ${(c.minOrderAmount / 100).toFixed(0)} TL` : ''}
                  {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} kullanım` : ` · ${c.usedCount} kullanım`}
                  {c.expiresAt ? ` · ${new Date(c.expiresAt).toLocaleDateString('tr-TR')} tarihine kadar` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => void toggle(c.id, c.isActive)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${c.isActive ? 'text-gray-600 border border-gray-200 hover:bg-gray-50' : 'text-green-700 border border-green-200 hover:bg-green-50'}`}>
                  {c.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button onClick={() => { void adminApi.deleteStoreCoupon(c.id).then(() => load()); }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <IcoTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

const PRIMARY_TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'analitik',  label: 'Analitik',  desc: 'Gelir ve satış özeti' },
  { id: 'urunler',   label: 'Ürünler',   desc: 'Vakıf ve satıcı ürünleri' },
  { id: 'siparisler',label: 'Siparişler',desc: 'Tüm siparişler' },
  { id: 'saticilar', label: 'Satıcılar', desc: 'Marketplace satıcıları' },
  { id: 'talepler',  label: 'Talepler',  desc: 'Mağaza başvuruları' },
  { id: 'odemeler',  label: 'Ödemeler',  desc: 'Satıcı hakediş ödemeleri' },
];

const SECONDARY_TABS: { id: Tab; label: string; group: string }[] = [
  { id: 'kuponlar',    label: 'Kuponlar',       group: 'Kampanya' },
  { id: 'pazarlama',   label: 'Pazarlama',      group: 'Kampanya' },
  { id: 'koleksiyonlar', label: 'Koleksiyonlar', group: 'Katalog' },
  { id: 'yorumlar',    label: 'Yorumlar',       group: 'Katalog' },
  { id: 'iade',        label: 'İadeler',        group: 'Lojistik' },
  { id: 'kargo',       label: 'Kargo',          group: 'Lojistik' },
  { id: 'faturalar',   label: 'Faturalar',      group: 'Finans' },
  { id: 'abonelik',    label: 'Abonelikler',    group: 'Finans' },
  { id: 'hediyeler',   label: 'Hediye Kartları', group: 'Finans' },
  { id: 'b2b',         label: 'B2B',            group: 'Finans' },
];

const SECONDARY_GROUPS = ['Kampanya', 'Katalog', 'Lojistik', 'Finans'] as const;

export default function MagazaPage() {
  const [tab, setTab] = useState<Tab>('saticilar');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function toggleGroup(group: string) {
    setOpenGroup(g => g === group ? null : group);
  }

  return (
    <div className="max-w-5xl">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mağaza</h1>
        <p className="text-sm text-gray-500 mt-1">Satıcılar, ürünler, siparişler ve içerik talepleri</p>
      </div>

      {/* Navigasyon */}
      <div className="flex items-center gap-1 mb-6 bg-[#eef4f9] rounded-xl p-1 w-fit">
        {/* Ana tablar */}
        {PRIMARY_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setOpenGroup(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-[#26496b] shadow-sm'
                : 'text-[#26496b]/50 hover:text-[#26496b]/80 hover:bg-white/40'
            }`}
          >
            {t.label}
          </button>
        ))}

        {/* 4 kategori butonu — ayrı zone */}
        <div className="flex items-center gap-0.5 bg-[#d4e6f2] rounded-lg p-0.5 ml-1">
        {SECONDARY_GROUPS.map(group => {
          const items = SECONDARY_TABS.filter(t => t.group === group);
          const groupActive = items.some(t => t.id === tab);
          const isOpen = openGroup === group;
          const activeItem = items.find(t => t.id === tab);

          return (
            <div key={group} className="relative">
              <button
                onClick={() => toggleGroup(group)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  groupActive
                    ? 'bg-white text-[#26496b] shadow-sm'
                    : isOpen
                    ? 'bg-white/60 text-[#26496b]/70'
                    : 'text-[#26496b]/60 hover:text-[#26496b] hover:bg-white/40'
                }`}
              >
                <span>{groupActive ? activeItem!.label : group}</span>
                <svg
                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenGroup(null)} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[140px]">
                    <p className="px-3.5 pt-0.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {group}
                    </p>
                    {items.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setTab(t.id); setOpenGroup(null); }}
                        className={`w-full text-left px-3.5 py-2 text-sm transition-colors rounded-lg ${
                          tab === t.id
                            ? 'text-[#26496b] font-semibold bg-[#26496b]/5'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* İçerik */}
      {tab === 'analitik'     && <AnalitikTab />}
      {tab === 'saticilar'    && <SaticilarTab />}
      {tab === 'urunler'      && <UrunlerTab />}
      {tab === 'koleksiyonlar'&& <KoleksiyonlarTab />}
      {tab === 'siparisler'   && <SiparislerTab />}
      {tab === 'faturalar'    && <FaturalarTab />}
      {tab === 'odemeler'     && <OdemelerTab />}
      {tab === 'iade'         && <IadeTab />}
      {tab === 'kargo'        && <KargoTab />}
      {tab === 'abonelik'     && <AbonelikTab />}
      {tab === 'b2b'          && <B2bTab />}
      {tab === 'kuponlar'     && <KuponlarTab />}
      {tab === 'hediyeler'    && <HediyelerTab />}
      {tab === 'yorumlar'     && <YorumlarTab />}
      {tab === 'pazarlama'    && <PazarlamaTab />}
      {tab === 'talepler'     && <TaleplerTab />}
    </div>
  );
}
