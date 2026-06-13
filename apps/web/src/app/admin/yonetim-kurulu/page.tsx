'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/site-admin-api';
import type { BoardMember } from '@/lib/site-admin-api';

const EMPTY: Partial<BoardMember> = { name: '', title: '', bio: '', avatarUrl: '', order: 0, isActive: true };

export default function YonetimKuruluPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BoardMember | null>(null);
  const [form, setForm] = useState<Partial<BoardMember>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.listBoardMembers().then(setMembers).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditItem(null); setForm(EMPTY); setFormError(''); setShowForm(true); }
  function openEdit(m: BoardMember) { setEditItem(m); setForm({ name: m.name, title: m.title, bio: m.bio ?? '', avatarUrl: m.avatarUrl ?? '', order: m.order, isActive: m.isActive }); setFormError(''); setShowForm(true); }

  async function handleSave() {
    if (!form.name?.trim() || !form.title?.trim()) { setFormError('Ad ve unvan zorunlu.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editItem) {
        const updated = await api.updateBoardMember(editItem.id, form);
        setMembers(p => p.map(m => m.id === editItem.id ? updated : m));
      } else {
        const created = await api.createBoardMember(form);
        setMembers(p => [...p, created]);
      }
      setShowForm(false);
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" üyesini silmek istediğinize emin misiniz?`)) return;
    try { await api.deleteBoardMember(id); setMembers(p => p.filter(x => x.id !== id)); }
    catch (e) { alert((e as Error).message); }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6b68]/30 focus:border-[#2d6b68]';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yönetim Kurulu</h1>
          <p className="text-sm text-gray-500 mt-1">Vakıf yönetim kurulu üyeleri</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-[#2d6b68] text-white text-sm font-medium rounded-lg hover:bg-[#235552] transition-colors">
          + Yeni Üye
        </button>
      </div>

      {loading && <p className="text-gray-500">Yükleniyor…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sıra</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unvan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aktif</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Henüz üye yok.</td></tr>}
              {members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{m.order}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(m)} className="text-[#2d6b68] hover:underline text-xs font-medium">Düzenle</button>
                    <button onClick={() => void handleDelete(m.id, m.name)} className="text-red-500 hover:underline text-xs font-medium">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{editItem ? 'Üyeyi Düzenle' : 'Yeni Üye'}</h3>
            {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Ad Soyad *</label><input className={inp} value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Unvan *</label><input className={inp} value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Biyografi</label><textarea className={inp} rows={3} value={form.bio ?? ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Fotoğraf URL</label><input className={inp} value={form.avatarUrl ?? ''} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-1">Sıra</label><input type="number" className={inp} value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} /></div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">İptal</button>
              <button onClick={() => void handleSave()} disabled={saving}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-[#2d6b68] text-white hover:bg-[#235552] disabled:opacity-40 transition-colors">
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
