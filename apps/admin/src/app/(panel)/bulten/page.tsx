'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { adminApi, type Newsletter, type MonthlyContent, type NewsletterAutomation, type AutomationStep } from '@/lib/api';
import { NewsletterBuilder, TiptapEditor, emptyCanvas, type CanvasState } from './_builder';
import { TemplateSelector, buildHtml, type TemplateId } from './_templates';
import type { CanvasBlock } from './_builder';


// ─── Sayfa ────────────────────────────────────────────────────────────────────

type Tab = 'gecmis' | 'olustur' | 'aboneler' | 'otomasyonlar' | 'analitik';

export default function BultenPage() {
  const [tab, setTab] = useState<Tab>('gecmis');
  const [editDraft, setEditDraft] = useState<Newsletter | null>(null);
  const [allNewsletters, setAllNewsletters] = useState<Newsletter[]>([]);

  function openEdit(n: Newsletter) { setEditDraft(n); setTab('olustur'); }
  function onSaved() { setEditDraft(null); setTab('gecmis'); }
  function openNew() { setEditDraft(null); setTab('olustur'); }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aylık Bülten</h1>
        <p className="text-sm text-gray-500 mt-1">E-posta aboneleri ve aylık bülten hazırlama & gönderme aracı</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: 'gecmis' as Tab, label: 'Geçmiş Bültenler' },
          { key: 'olustur' as Tab, label: editDraft ? '✏ Taslağı Düzenle' : '+ Yeni Bülten' },
          { key: 'aboneler' as Tab, label: 'Aboneler' },
          { key: 'otomasyonlar' as Tab, label: '⚡ Otomasyonlar' },
          { key: 'analitik' as Tab, label: '📊 Analitik' },
        ]).map(t => (
          <button key={t.key} onClick={() => { if (t.key !== 'olustur') setEditDraft(null); setTab(t.key); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-white text-[#26496b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gecmis' && <GecmisTab onNew={openNew} onEdit={openEdit} onListLoad={setAllNewsletters} />}
      {tab === 'olustur' && <OlusturTab draft={editDraft} onSaved={onSaved} pastNewsletters={allNewsletters} />}
      {tab === 'aboneler' && <AbonelerTab />}
      {tab === 'otomasyonlar' && <OtomasyonlarTab />}
      {tab === 'analitik' && <AnalitikTab />}
    </div>
  );
}

// ─── Geçmiş Tab ───────────────────────────────────────────────────────────────

type NewsletterStats = { delivered: number; opens: number; clicks: number; unsubscriptions: number; hardBounces: number; softBounces: number; openRate: number; clickRate: number };

function GecmisTab({ onNew, onEdit, onListLoad }: { onNew: () => void; onEdit: (n: Newsletter) => void; onListLoad?: (list: Newsletter[]) => void }) {
  const [list, setList] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [livePreviewHtml, setLivePreviewHtml] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [testModal, setTestModal] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Segmente gönderim
  const [segmentModal, setSegmentModal] = useState<Newsletter | null>(null);
  const [segFilters, setSegFilters] = useState<{ tags: string[]; interestAreas: string[]; behavior: string }>({ tags: [], interestAreas: [], behavior: '' });
  const [segPreview, setSegPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [segPreviewing, setSegPreviewing] = useState(false);
  const [segSending, setSegSending] = useState(false);

  function load() {
    setLoading(true);
    adminApi.listNewsletters().then(list => { setList(list); onListLoad?.(list); }).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const preview = list.find(n => n.id === previewId);

  function openPreview(n: Newsletter) {
    const sc = n.selectedContent as Record<string, unknown> | null | undefined;
    if (sc?.blocks && Array.isArray(sc.blocks)) {
      const canvas: CanvasState = {
        blocks: sc.blocks as CanvasState['blocks'],
        heroImage: (sc.heroImage as string) ?? '',
        ctaText:   (sc.ctaText   as string) ?? '',
        ctaUrl:    (sc.ctaUrl    as string) ?? '',
      };
      setLivePreviewHtml(buildHtml({
        title:     n.title,
        month:     n.month,
        intro:     (sc.intro     as string) ?? '',
        highlight: (sc.highlight as string) ?? '',
        canvas,
        template:  (sc.template  as TemplateId) ?? 'klasik',
        preview:   true,
      }));
    } else {
      setLivePreviewHtml(null);
    }
    setPreviewId(n.id);
  }

  async function previewSeg() {
    setSegPreviewing(true);
    try {
      const filters = {
        ...(segFilters.tags.length ? { tags: segFilters.tags } : {}),
        ...(segFilters.interestAreas.length ? { interestAreas: segFilters.interestAreas } : {}),
        ...(segFilters.behavior ? { behavior: segFilters.behavior } : {}),
      };
      const r = await adminApi.previewSegment(filters);
      setSegPreview(r);
    } catch { /* sessiz */ }
    finally { setSegPreviewing(false); }
  }

  async function sendSeg() {
    if (!segmentModal) return;
    if (!confirm(`${segPreview?.count ?? '?'} kişiye göndermek istiyor musunuz?`)) return;
    setSegSending(true);
    try {
      const filters = {
        ...(segFilters.tags.length ? { tags: segFilters.tags } : {}),
        ...(segFilters.interestAreas.length ? { interestAreas: segFilters.interestAreas } : {}),
        ...(segFilters.behavior ? { behavior: segFilters.behavior } : {}),
      };
      const r = await adminApi.sendToSegment(segmentModal.id, filters);
      alert(`✓ ${r.recipientCount} kişiye gönderildi`);
      setSegmentModal(null);
      setSegPreview(null);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Hata'); }
    finally { setSegSending(false); }
  }

  async function cloneNewsletter(n: Newsletter) {
    setCloning(n.id);
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await adminApi.createNewsletter({
        title: `(Kopya) ${n.title}`,
        month: currentMonth,
        subject: n.subject,
        selectedContent: (n.selectedContent ?? {}) as Record<string, unknown>,
        channels: n.channels ?? ['email'],
      });
      load();
    } catch { alert('Kopyalama başarısız'); }
    finally { setCloning(null); }
  }

  async function deleteDraft(id: string) {
    if (!confirm('Bu taslağı silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    await adminApi.deleteNewsletter(id).catch(() => {});
    setDeleting(null);
    load();
  }

  async function openStats(id: string) {
    setStatsId(id); setStats(null); setStatsLoading(true);
    try { setStats(await adminApi.getNewsletterStats(id)); }
    catch { /* sessiz */ }
    finally { setStatsLoading(false); }
  }

  async function sendNow(id: string) {
    if (!confirm('Bülteni şimdi göndermek istediğinize emin misiniz?')) return;
    setSending(id);
    try {
      // Göndermeden önce HTML'i güncel şablonla yeniden oluştur
      const n = list.find(item => item.id === id);
      const sc = n?.selectedContent as Record<string, unknown> | null | undefined;
      if (n && sc?.blocks && Array.isArray(sc.blocks)) {
        const canvas: CanvasState = {
          blocks: sc.blocks as CanvasState['blocks'],
          heroImage: (sc.heroImage as string) ?? '',
          ctaText:   (sc.ctaText   as string) ?? '',
          ctaUrl:    (sc.ctaUrl    as string) ?? '',
        };
        const html = buildHtml({
          title:     n.title,
          month:     n.month,
          intro:     (sc.intro     as string) ?? '',
          highlight: (sc.highlight as string) ?? '',
          canvas,
          template:  (sc.template  as TemplateId) ?? 'klasik',
        });
        await adminApi.updateNewsletter(id, { htmlBody: html });
      }
      await adminApi.sendNewsletter(id);
      load();
    }
    catch (e) { alert(e instanceof Error ? e.message : 'Gönderim hatası'); }
    finally { setSending(null); }
  }

  async function sendTest() {
    if (!testModal || !testEmail.trim()) return;
    setTestSending(true);
    try {
      // Test göndermeden önce de HTML'i yenile
      const n = list.find(item => item.id === testModal);
      const sc = n?.selectedContent as Record<string, unknown> | null | undefined;
      if (n && sc?.blocks && Array.isArray(sc.blocks)) {
        const canvas: CanvasState = {
          blocks: sc.blocks as CanvasState['blocks'],
          heroImage: (sc.heroImage as string) ?? '',
          ctaText:   (sc.ctaText   as string) ?? '',
          ctaUrl:    (sc.ctaUrl    as string) ?? '',
        };
        const html = buildHtml({
          title:     n.title,
          month:     n.month,
          intro:     (sc.intro     as string) ?? '',
          highlight: (sc.highlight as string) ?? '',
          canvas,
          template:  (sc.template  as TemplateId) ?? 'klasik',
        });
        await adminApi.updateNewsletter(testModal, { htmlBody: html });
      }
      const r = await adminApi.testSendNewsletter(testModal, testEmail.trim());
      if (r.ok) { alert('Test e-postası gönderildi ✓'); setTestModal(null); setTestEmail(''); }
      else alert('Gönderim başarısız');
    } catch (e) { alert(e instanceof Error ? e.message : 'Hata'); }
    finally { setTestSending(false); }
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>;

  return (
    <div className="space-y-3">
      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setPreviewId(null); setLivePreviewHtml(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <div><p className="font-bold text-gray-900">{preview.title}</p><p className="text-xs text-gray-400">Konu: {preview.subject}</p></div>
              <button onClick={() => { setPreviewId(null); setLivePreviewHtml(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <iframe srcDoc={livePreviewHtml ?? preview.htmlBody ?? '<p style="padding:32px;color:#888">İçerik yok</p>'}
                className="w-full min-h-[600px] border-0" title="Önizleme" />
            </div>
          </div>
        </div>
      )}

      {/* Test gönderim modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setTestModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-gray-900">Test E-postası Gönder</p>
            <input type="email" placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]"
              onKeyDown={e => { if (e.key === 'Enter') void sendTest(); }} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setTestModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
              <button disabled={testSending || !testEmail.trim()} onClick={() => void sendTest()}
                className="px-4 py-2 text-sm font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {testSending ? '…' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brevo İstatistik Modal */}
      {statsId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setStatsId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">Brevo Kampanya İstatistikleri</p>
              <button onClick={() => setStatsId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            {statsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : !stats ? (
              <p className="text-sm text-gray-400 text-center py-4">İstatistik bulunamadı.<br /><span className="text-xs">Brevo kampanya ID gerekli.</span></p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-700">{stats.openRate}%</p>
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mt-0.5">Açılma Oranı</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{stats.opens} açılma / {stats.delivered} iletildi</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-700">{stats.clickRate}%</p>
                  <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wide mt-0.5">Tıklanma Oranı</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{stats.clicks} tıklama</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-amber-700">{stats.unsubscriptions}</p>
                  <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide mt-0.5">Abonelik İptali</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-red-700">{stats.hardBounces + stats.softBounces}</p>
                  <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide mt-0.5">Bounce</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">H:{stats.hardBounces} / S:{stats.softBounces}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Segmente Gönderim Modal */}
      {segmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setSegmentModal(null); setSegPreview(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">Segmente Gönder</p>
              <button onClick={() => { setSegmentModal(null); setSegPreview(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-xs text-gray-500"><strong>{segmentModal.title}</strong> bültenini seçili segmente gönder. Filtre boş bırakılırsa tüm abonelere gider.</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Etiket (boş = hepsi)</p>
                <input className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30"
                  placeholder="etkinlik,egitim (virgülle ayır)"
                  onChange={e => setSegFilters(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">İlgi Alanı</p>
                <input className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30"
                  placeholder="etkinlikler,egitimler,kariyer (virgülle ayır)"
                  onChange={e => setSegFilters(f => ({ ...f, interestAreas: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Davranış Filtresi</p>
                <select className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  onChange={e => setSegFilters(f => ({ ...f, behavior: e.target.value }))}>
                  <option value="">Tümü</option>
                  <option value="active_90d">Son 90 günde aktif</option>
                  <option value="inactive_90d">Son 90 günde pasif</option>
                  <option value="never_opened">Hiç açmamış</option>
                </select>
              </div>
            </div>
            {segPreview && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-blue-700">{segPreview.count}</p>
                <p className="text-[10px] text-blue-500 font-semibold">kişi bu segmente uyuyor</p>
                {segPreview.sample.length > 0 && <p className="text-[10px] text-gray-400 mt-1">{segPreview.sample.join(', ')}{segPreview.count > 5 ? '…' : ''}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => void previewSeg()} disabled={segPreviewing}
                className="flex-1 px-3 py-2 text-xs font-semibold text-[#26496b] border border-[#26496b]/30 rounded-lg hover:bg-[#26496b]/5 disabled:opacity-50">
                {segPreviewing ? 'Hesaplanıyor…' : 'Önizle'}
              </button>
              <button onClick={() => void sendSeg()} disabled={segSending || !segPreview || segPreview.count === 0}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                {segSending ? 'Gönderiliyor…' : `Gönder${segPreview ? ` (${segPreview.count})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 mb-4">Henüz bülten oluşturulmamış.</p>
          <button onClick={onNew} className="px-5 py-2 text-sm font-semibold bg-[#26496b] text-white rounded-xl hover:bg-[#1e3a56]">İlk Bülteni Oluştur</button>
        </div>
      ) : (
        list.map(n => {
          const [yr, mo] = n.month.split('-');
          const monthLabel = new Date(parseInt(yr!), parseInt(mo!) - 1, 1)
            .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
          return (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#26496b]/10 flex items-center justify-center shrink-0 text-[#26496b] font-black text-xs">{mo}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${n.status === 'sent' ? 'bg-green-100 text-green-700' : n.status === 'failed' ? 'bg-red-100 text-red-700' : n.status === 'scheduled' ? 'bg-purple-100 text-purple-700' : n.status === 'sending' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {n.status === 'sent' ? 'Gönderildi' : n.status === 'failed' ? 'Hatalı' : n.status === 'scheduled' ? '⏰ Zamanlandı' : n.status === 'sending' ? '⏳ Gönderiliyor' : 'Taslak'}
                  </span>
                  <span className="text-[10px] text-gray-400">{monthLabel}</span>
                  {n.emailCount != null && n.emailCount > 0 && <span className="text-[10px] text-gray-400">· 📧 {n.emailCount}</span>}
                  {n.whatsappCount != null && n.whatsappCount > 0 && <span className="text-[10px] text-gray-400">· 💬 {n.whatsappCount}</span>}
                  {n.scheduledAt && n.status === 'scheduled' && <span className="text-[10px] text-purple-500">· {new Date(n.scheduledAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  {n.sentAt && <span className="text-[10px] text-gray-400">· {new Date(n.sentAt).toLocaleDateString('tr-TR')}</span>}
                </div>
                <p className="font-semibold text-sm text-gray-900 truncate">{n.title}</p>
                <p className="text-xs text-gray-400 truncate">{n.subject}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {n.htmlBody && (
                  <button onClick={() => openPreview(n)}
                    className="px-2.5 py-1 text-xs font-medium text-[#26496b] border border-[#26496b]/20 rounded-lg hover:bg-[#26496b]/5">
                    Önizle
                  </button>
                )}
                {n.htmlBody && (
                  <button onClick={() => { setTestModal(n.id); setTestEmail(''); }}
                    className="px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Test
                  </button>
                )}
                {n.status === 'sent' && n.brevioCampaignId && (
                  <button onClick={() => void openStats(n.id)}
                    className="px-2.5 py-1 text-xs font-medium text-[#26496b] border border-[#26496b]/20 rounded-lg hover:bg-[#26496b]/5">
                    📊 İstatistik
                  </button>
                )}
                {/* Segmente Gönder */}
                {n.htmlBody && (
                  <button onClick={() => { setSegFilters({ tags: [], interestAreas: [], behavior: '' }); setSegPreview(null); setSegmentModal(n); }}
                    className="px-2.5 py-1 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50">
                    🎯 Segmente Gönder
                  </button>
                )}
                {/* Kopyala — tüm bültenler için */}
                <button disabled={cloning === n.id} onClick={() => void cloneNewsletter(n)}
                  title="Yeni taslak olarak kopyala"
                  className="px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  {cloning === n.id ? '…' : '⎘ Kopyala'}
                </button>
                {(n.status === 'draft' || n.status === 'scheduled') && (
                  <>
                    <button onClick={() => onEdit(n)}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Düzenle
                    </button>
                    <button disabled={sending === n.id} onClick={() => void sendNow(n.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1e3a56] disabled:opacity-50">
                      {sending === n.id ? '…' : n.status === 'scheduled' ? 'Şimdi Gönder' : 'Gönder'}
                    </button>
                    <button disabled={deleting === n.id} onClick={() => void deleteDraft(n.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Oluştur / Düzenle Tab ────────────────────────────────────────────────────

function OlusturTab({ draft, onSaved, pastNewsletters = [] }: { draft: Newsletter | null; onSaved: () => void; pastNewsletters?: Newsletter[] }) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const saved = draft?.selectedContent;

  const [month, setMonth] = useState(draft?.month ?? defaultMonth);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [subject, setSubject] = useState(draft?.subject ?? '');
  const [intro, setIntro] = useState((saved?.intro as string | undefined) ?? '');
  const [highlight, setHighlight] = useState((saved?.highlight as string | undefined) ?? '');
  const [template, setTemplate] = useState<TemplateId>((saved?.template as TemplateId) ?? 'klasik');
  const [channels, setChannels] = useState<Set<string>>(new Set(draft?.channels ?? ['email']));
  const [waTemplate, setWaTemplate] = useState(draft?.whatsappTemplateName ?? '');
  const [waTemplates, setWaTemplates] = useState<Array<{ name: string; language: string }>>([]);
  const [waTemplatesLoading, setWaTemplatesLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(draft?.scheduledAt ? new Date(draft.scheduledAt).toISOString().slice(0, 16) : '');
  const [subjectB, setSubjectB] = useState((draft?.selectedContent as Record<string,unknown> | null)?.subjectB as string ?? '');
  const [preheader, setPreheader] = useState((saved?.preheader as string | undefined) ?? '');
  const [showInboxPreview, setShowInboxPreview] = useState(false);
  const [inboxClient, setInboxClient] = useState<'gmail' | 'outlook' | 'apple'>('gmail');
  const [inboxDark, setInboxDark] = useState(false);
  const [brevoSegmentId, setBrevoSegmentId] = useState<string>((saved?.brevoSegmentId as string | undefined) ?? '');

  const [canvas, setCanvas] = useState<CanvasState>(() => {
    const sc = draft?.selectedContent;
    if (sc?.blocks && Array.isArray(sc.blocks)) {
      return {
        blocks: sc.blocks as import('./_builder').CanvasBlock[],
        heroImage: (sc.heroImage as string) ?? '',
        ctaText:   (sc.ctaText   as string) ?? '',
        ctaUrl:    (sc.ctaUrl    as string) ?? '',
      };
    }
    return emptyCanvas();
  });
  const [content, setContent] = useState<MonthlyContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { htmlSizeKb, liveHtml } = useMemo(() => {
    try {
      const html = buildHtml({ title, month, intro, highlight, canvas, template, preview: true, ...(canvas.themeColor ? { themeColor: canvas.themeColor } : {}) });
      return { htmlSizeKb: html.length / 1024, liveHtml: html };
    } catch { return { htmlSizeKb: 0, liveHtml: '' }; }
  }, [title, month, intro, highlight, canvas, template]); // eslint-disable-line
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);

  // ─── Otomatik Taslak Kayıt (localStorage, 30s) ─────────────────────────────
  const DRAFT_LS_KEY = 'bulten_olustur_draft';

  // Yeni bülten oluşturulurken localStorage'dan yükle
  useEffect(() => {
    if (draft) return; // Düzenleme modunda localStorage'ı atla
    try {
      const raw = localStorage.getItem(DRAFT_LS_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, unknown>;
      if (stored.title) setTitle(stored.title as string);
      if (stored.subject) setSubject(stored.subject as string);
      if (stored.intro) setIntro(stored.intro as string);
      if (stored.highlight) setHighlight(stored.highlight as string);
      if (stored.preheader) setPreheader(stored.preheader as string);
      if (stored.month) setMonth(stored.month as string);
      if (stored.template) setTemplate(stored.template as TemplateId);
      if (stored.canvas) setCanvas(stored.canvas as CanvasState);
      setAutoSavedAt(new Date(stored.savedAt as string));
    } catch { /* sessiz */ }
  }, []); // eslint-disable-line

  // 30 saniyede bir otosave
  useEffect(() => {
    if (draft) return;
    const id = setInterval(() => {
      try {
        localStorage.setItem(DRAFT_LS_KEY, JSON.stringify({ title, subject, intro, highlight, preheader, month, template, canvas, savedAt: new Date().toISOString() }));
        setAutoSavedAt(new Date());
      } catch { /* sessiz */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [draft, title, subject, intro, highlight, preheader, month, template, canvas]); // eslint-disable-line

  function clearAutoSave() {
    try { localStorage.removeItem(DRAFT_LS_KEY); } catch { /* sessiz */ }
  }

  const loadContent = useCallback(() => {
    setContentLoading(true);
    setContentError('');
    setContent(null);
    adminApi.getMonthlyContent(month)
      .then(data => {
        setContent(data);
        if (!draft) {
          const [yr, mo] = month.split('-');
          const label = new Date(parseInt(yr!), parseInt(mo!) - 1, 1)
            .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
          setTitle(prev => prev || `${label} Bülteni`);
          setSubject(prev => prev || `Haritailesi ${label} Bülteni`);
        }
      })
      .catch((e: unknown) => {
        setContentError(e instanceof Error ? e.message : 'İçerik yüklenemedi');
      })
      .finally(() => setContentLoading(false));
  }, [month, draft]);

  useEffect(() => { loadContent(); }, [loadContent]);

  function autoFillCanvas() {
    if (!content) return;
    const newBlocks: CanvasBlock[] = [];
    const addSection = (key: import('./_builder').SectionKey, items: Array<{ id: string; title: string; [k: string]: unknown }>, kindMap: (i: { id: string; title: string; [k: string]: unknown }) => import('./_builder').CanvasItem) => {
      if (items.length === 0) return;
      newBlocks.push({ uid: `auto_${key}`, kind: key, items: items.slice(0, 5).map(kindMap) } as import('./_builder').SectionBlock);
    };
    addSection('events', content.events, i => ({ uid: `ev_${i.id}`, kind: 'event', id: i.id, title: i.title, sub: (i['dateStart'] as string | undefined) ?? '' }));
    addSection('trainings', content.trainings, i => ({ uid: `tr_${i.id}`, kind: 'training', id: i.id, title: i.title, sub: (i['instructor'] as string | null | undefined) ?? '' }));
    addSection('competitions', content.competitions, i => ({ uid: `co_${i.id}`, kind: 'competition', id: i.id, title: i.title, sub: (i['deadline'] as string | null | undefined) ?? '' }));
    addSection('jobs', content.jobs, i => ({ uid: `jo_${i.id}`, kind: 'job', id: i.id, title: i.title, sub: (i['company'] as string | undefined) ?? '' }));
    addSection('projects', content.projects, i => ({ uid: `pr_${i.id}`, kind: 'project', id: i.id, title: i.title, sub: (i['authorName'] as string | null | undefined) ?? '' }));
    if (newBlocks.length > 0) {
      setCanvas(prev => ({ ...prev, blocks: newBlocks }));
    }
  }

  useEffect(() => {
    if (!channels.has('whatsapp') || waTemplates.length > 0) return;
    setWaTemplatesLoading(true);
    adminApi.getWhatsappTemplates()
      .then(d => setWaTemplates(d.templates ?? []))
      .catch(() => {})
      .finally(() => setWaTemplatesLoading(false));
  }, [channels]); // eslint-disable-line

  function generatePreview() {
    setPreviewHtml(buildHtml({ title, month, intro, highlight, canvas, template, preview: true }));
    setShowPreview(true);
  }

  function buildDto(html: string) {
    return {
      title, month, subject, htmlBody: html,
      selectedContent: {
        blocks: canvas.blocks,
        template,
        intro, highlight,
        preheader,
        heroImage: canvas.heroImage,
        ctaText: canvas.ctaText,
        ctaUrl: canvas.ctaUrl,
        themeColor: canvas.themeColor || '',
        ...(subjectB.trim() ? { subjectB: subjectB.trim() } : {}),
        ...(brevoSegmentId ? { brevoSegmentId } : {}),
        // flat lists for backward compat
        events: canvas.blocks.filter(b => b.kind === 'events').flatMap(b => 'items' in b ? (b as { items: { id: string }[] }).items.map(i => i.id) : []),
        trainings: canvas.blocks.filter(b => b.kind === 'trainings').flatMap(b => 'items' in b ? (b as { items: { id: string }[] }).items.map(i => i.id) : []),
        jobs: canvas.blocks.filter(b => b.kind === 'jobs').flatMap(b => 'items' in b ? (b as { items: { id: string }[] }).items.map(i => i.id) : []),
        competitions: canvas.blocks.filter(b => b.kind === 'competitions').flatMap(b => 'items' in b ? (b as { items: { id: string }[] }).items.map(i => i.id) : []),
      } as Record<string, unknown>,
      channels: [...channels],
      ...(channels.has('whatsapp') && waTemplate ? { whatsappTemplateName: waTemplate } : {}),
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    };
  }

  async function handleUploadImage(file: File): Promise<string> {
    const result = await adminApi.uploadNewsletterImage(file);
    return result.url;
  }

  async function saveDraft() {
    if (!title.trim() || !subject.trim()) { setError('Başlık ve konu zorunlu'); return; }
    setSaving(true); setError('');
    try {
      const html = buildHtml({ title, month, intro, highlight, canvas, template });
      if (draft) await adminApi.updateNewsletter(draft.id, buildDto(html));
      else await adminApi.createNewsletter(buildDto(html));
      clearAutoSave();
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata'); }
    finally { setSaving(false); }
  }

  async function saveAndSend() {
    if (!title.trim() || !subject.trim()) { setError('Başlık ve konu zorunlu'); return; }
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (d <= new Date()) { setError('Zamanlanmış gönderim için gelecek bir tarih seçin'); return; }
      if (!confirm(`Bülten ${d.toLocaleString('tr-TR')} tarihinde otomatik gönderilecek. Devam?`)) return;
      setSaving(true); setError('');
      try {
        const html = buildHtml({ title, month, intro, highlight, canvas, template });
        if (draft) await adminApi.updateNewsletter(draft.id, buildDto(html));
        else await adminApi.createNewsletter(buildDto(html));
        onSaved();
      } catch (e) { setError(e instanceof Error ? e.message : 'Kaydetme hatası'); }
      finally { setSaving(false); }
      return;
    }
    if (!confirm('Bülteni oluşturup hemen göndermek istediğinize emin misiniz?')) return;
    setSending(true); setError('');
    try {
      const html = buildHtml({ title, month, intro, highlight, canvas, template });
      let id = draft?.id;
      if (id) await adminApi.updateNewsletter(id, buildDto(html));
      else { const n = await adminApi.createNewsletter(buildDto(html)); id = n.id; }
      await adminApi.sendNewsletter(id!);
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gönderim hatası'); }
    finally { setSending(false); }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#26496b]';

  return (
    <div className="space-y-5">
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <p className="font-bold text-gray-900">E-posta Önizlemesi</p>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <iframe srcDoc={previewHtml} className="w-full min-h-[600px] border-0" title="Önizleme" />
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-700">
          ✏ <strong>{draft.title}</strong> taslağı düzenleniyor
        </div>
      )}
      {!draft && autoSavedAt && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Otomatik kaydedildi — {autoSavedAt.toLocaleTimeString('tr-TR')}
        </div>
      )}

      {/* Bülten Bilgileri */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bülten Bilgileri</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Ay *</label>
            <input type="month" className={inp} value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Başlık *</label>
            <input className={inp} placeholder="Haziran 2026 Bülteni" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">E-posta Konusu * <span className="normal-case text-gray-300">(A varyantı)</span></label>
            <input className={inp} placeholder="Haritailesi Haziran Bülteni – Etkinlik ve Eğitimler" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">
              A/B Test Konusu <span className="normal-case text-gray-300">(B varyantı · boş = A/B yok)</span>
            </label>
            <div className="relative">
              <input className={inp} placeholder="Alternatif konu satırı (Brevo %50 split)" value={subjectB} onChange={e => setSubjectB(e.target.value)} />
              {subjectB && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">A/B</span>
              )}
            </div>
            {subjectB && (
              <p className="text-[10px] text-purple-600 mt-1">Brevo %50/%50 split · 6 saat sonra kazanan varyant seçilir</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">
              Ön İzleme Metni <span className="normal-case text-gray-300">(inbox'ta konu altında görünür, ~90 karakter)</span>
            </label>
            <div className="relative">
              <input className={inp} placeholder="Bu ay etkinlikler, eğitimler ve çok daha fazlası…" value={preheader} onChange={e => setPreheader(e.target.value)} maxLength={120} />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono ${preheader.length > 90 ? 'text-orange-400' : 'text-gray-300'}`}>{preheader.length}/90</span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Giriş Metni</label>
            <textarea rows={2} className={inp} placeholder="Merhaba, bu ay haritacılık dünyasından..." value={intro} onChange={e => setIntro(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Öne Çıkan İçerik</label>
            <textarea rows={2} className={inp} placeholder="Bu ay özellikle dikkat çeken bir duyuru, başarı ya da içerik..." value={highlight} onChange={e => setHighlight(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Kapak Görseli URL</label>
            <input className={inp} placeholder="https://..." value={canvas.heroImage}
              onChange={e => setCanvas(c => ({ ...c, heroImage: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Footer Metni (opsiyonel)</label>
            <input className={inp} placeholder="Haritailesi Vakfı · haritailesi.org" value={canvas.footerText ?? ''}
              onChange={e => setCanvas(c => { const { footerText: _ft, ...rest } = c; return e.target.value ? { ...rest, footerText: e.target.value } : rest; })} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">CTA Buton Metni</label>
            <input className={inp} placeholder="Sahne'yi Keşfet" value={canvas.ctaText}
              onChange={e => setCanvas(c => ({ ...c, ctaText: e.target.value }))} />
          </div>
          {canvas.ctaText && (
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">CTA Bağlantı URL</label>
              <input className={inp} placeholder={`${process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org'}`} value={canvas.ctaUrl}
                onChange={e => setCanvas(c => ({ ...c, ctaUrl: e.target.value }))} />
            </div>
          )}
        </div>
      </div>

      {/* Inbox Önizleme Modal */}
      {showInboxPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowInboxPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <p className="font-bold text-gray-900 text-sm">📬 Inbox Önizleme</p>
              <div className="flex items-center gap-3">
                {/* İstemci seçimi */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  {(['gmail','outlook','apple'] as const).map(c => (
                    <button key={c} onClick={() => setInboxClient(c)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${inboxClient === c ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                      {c === 'gmail' ? 'Gmail' : c === 'outlook' ? 'Outlook' : 'Apple Mail'}
                    </button>
                  ))}
                </div>
                {/* Dark mode */}
                <button onClick={() => setInboxDark(v => !v)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${inboxDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {inboxDark ? '🌙 Koyu' : '☀ Açık'}
                </button>
                <button onClick={() => setShowInboxPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            {/* Inbox simülasyonu */}
            <div className={`p-5 shrink-0 ${inboxDark ? 'bg-gray-900' : 'bg-white'}`}>
              {/* E-posta listesi satırı */}
              <div className={`rounded-xl border overflow-hidden ${inboxDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`flex items-start gap-3 px-4 py-3 ${inboxDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5`} style={{ background: '#26496b' }}>H</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className={`text-sm font-bold truncate ${inboxDark ? 'text-white' : 'text-gray-900'}`}>Haritailesi Vakfı</span>
                      <span className={`text-[10px] shrink-0 ${inboxDark ? 'text-gray-400' : 'text-gray-400'}`}>Şimdi</span>
                    </div>
                    <p className={`text-xs font-semibold truncate ${inboxDark ? 'text-gray-200' : 'text-gray-700'}`}>{subject || '(konu girilmedi)'}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${inboxDark ? 'text-gray-500' : 'text-gray-400'}`}>{preheader || intro.slice(0,90) || '(ön izleme metni yok)'}</p>
                  </div>
                </div>
                {/* E-posta içeriği */}
                <div className={`${inboxClient === 'gmail' ? 'max-w-full' : inboxClient === 'outlook' ? 'max-w-[580px]' : 'max-w-full'} mx-auto`}>
                  <iframe srcDoc={liveHtml} className="w-full border-0" style={{ minHeight: 400, background: inboxDark ? '#1f2937' : '#fff' }} title="Inbox önizleme" />
                </div>
              </div>
            </div>
            {/* HTML kopyala */}
            <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-mono ${htmlSizeKb > 100 ? 'text-red-500' : htmlSizeKb > 60 ? 'text-orange-500' : 'text-green-600'}`}>{htmlSizeKb.toFixed(1)} KB</span>
                {htmlSizeKb > 100 && <span className="text-[10px] text-red-500">⚠ 100KB üzeri bazı istemcilerde kesilir</span>}
              </div>
              <button onClick={() => { void navigator.clipboard.writeText(liveHtml); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#26496b] text-white text-xs font-semibold rounded-lg hover:bg-[#1e3a56] transition-colors">
                📋 HTML'yi Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şablon Seçimi */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">E-posta Şablonu</p>
          <button onClick={() => setShowInboxPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#26496b] border border-[#26496b]/25 rounded-lg hover:bg-[#26496b]/5 transition-colors">
            📬 Inbox Önizleme
          </button>
        </div>
        <TemplateSelector selected={template} onChange={setTemplate} />
      </div>

      {/* Sürükle-Bırak Builder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">İçerik Düzenleyici — {month}</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400">Sol panelden sürükle, bölgelere bırak</span>
            <button onClick={loadContent} disabled={contentLoading}
              className="text-xs text-[#26496b] hover:underline font-medium disabled:opacity-50">
              {contentLoading ? 'Yükleniyor…' : '↺ Yenile'}
            </button>
          </div>
        </div>
        {contentLoading ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : !content ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm text-red-500">{contentError || 'İçerik yüklenemedi.'}</p>
            <button onClick={loadContent} className="text-xs text-[#26496b] hover:underline">Tekrar dene</button>
          </div>
        ) : (
          <>
            {(content.events.length + content.trainings.length + content.competitions.length + content.jobs.length + content.projects.length) > 0 && (
              <div className="mb-3 flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-blue-700 font-medium">
                  {[content.events.length > 0 && `${content.events.length} etkinlik`, content.trainings.length > 0 && `${content.trainings.length} eğitim`, content.competitions.length > 0 && `${content.competitions.length} yarışma`, content.jobs.length > 0 && `${content.jobs.length} ilan`, content.projects.length > 0 && `${content.projects.length} proje`].filter(Boolean).join(' · ')} bu ay
                </p>
                <button onClick={autoFillCanvas}
                  className="px-3 py-1 text-[10px] font-bold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors">
                  Hepsini Ekle ✨
                </button>
              </div>
            )}
            <NewsletterBuilder
              content={content} canvas={canvas} onChange={setCanvas}
              intro={intro} highlight={highlight}
              onIntroChange={setIntro} onHighlightChange={setHighlight}
              htmlSizeKb={htmlSizeKb} liveHtml={liveHtml}
              onUploadImage={handleUploadImage}
              pastNewsletters={pastNewsletters.filter(n => n.selectedContent && (n.selectedContent as Record<string,unknown>)['blocks'])}
            />
          </>
        )}
      </div>

      {/* Kanallar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Gönderim Kanalları</p>
        <div className="space-y-2.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={channels.has('email')}
              onChange={e => setChannels(prev => { const s = new Set(prev); e.target.checked ? s.add('email') : s.delete('email'); return s; })}
              className="mt-0.5 w-4 h-4 rounded accent-[#26496b]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">📧 E-posta (Brevo)</p>
              <p className="text-[10px] text-gray-400">Newsletter abone listesindeki tüm kişilere</p>
            </div>
          </label>
          {/* Segment seçimi */}
          {channels.has('email') && (
            <div className="ml-7 space-y-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block">Hedef Kitle</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: '', label: 'Tüm Aboneler', desc: 'Listedeki herkes', icon: '👥' },
                  { id: 'etkinlik', label: 'Etkinlik İlgili', desc: 'Etkinlik etiketi', icon: '📅' },
                  { id: 'egitim', label: 'Eğitim İlgili', desc: 'Eğitim etiketi', icon: '🎓' },
                  { id: 'uye', label: 'Yalnızca Üyeler', desc: 'Onaylanmış üyeler', icon: '✅' },
                ].map(seg => (
                  <button key={seg.id} type="button"
                    onClick={() => setBrevoSegmentId(seg.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all ${brevoSegmentId === seg.id ? 'border-[#26496b] bg-[#26496b]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <span className="text-base">{seg.icon}</span>
                    <div>
                      <p className={`text-[11px] font-bold ${brevoSegmentId === seg.id ? 'text-[#26496b]' : 'text-gray-700'}`}>{seg.label}</p>
                      <p className="text-[9px] text-gray-400">{seg.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {brevoSegmentId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">Özel Brevo Segment ID:</span>
                  <input className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]"
                    placeholder="Brevo segment ID (opsiyonel)" value={brevoSegmentId}
                    onChange={e => setBrevoSegmentId(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={channels.has('whatsapp')}
              onChange={e => setChannels(prev => { const s = new Set(prev); e.target.checked ? s.add('whatsapp') : s.delete('whatsapp'); return s; })}
              className="mt-0.5 w-4 h-4 rounded accent-[#25d366]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">💬 WhatsApp (Meta Şablon)</p>
              <p className="text-[10px] text-gray-400">WhatsApp onayı olan üyelere arka planda gönderilir</p>
            </div>
          </label>
        </div>
        {channels.has('whatsapp') && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">WhatsApp Şablon Adı *</label>
              {waTemplatesLoading ? (
                <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ) : waTemplates.length > 0 ? (
                <select className={inp} value={waTemplate} onChange={e => setWaTemplate(e.target.value)}>
                  <option value="">— Şablon seçin —</option>
                  {waTemplates.map(t => (
                    <option key={`${t.name}-${t.language}`} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
              ) : (
                <>
                  <input className={inp} placeholder="haritailesi_bulten" value={waTemplate} onChange={e => setWaTemplate(e.target.value)} />
                  <p className="text-[10px] text-gray-400 mt-1">Meta Business Manager'da onaylanmış şablonun adını girin</p>
                </>
              )}
            </div>
            {waTemplate && (
              <div className="bg-[#25d366]/8 border border-[#25d366]/25 rounded-xl p-3.5 space-y-2.5">
                <p className="text-[10px] font-bold text-[#128c7e] uppercase tracking-wide">💬 WhatsApp Önizleme</p>
                <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-[220px] shadow-sm">
                  <p className="text-[11px] text-gray-800 leading-relaxed">
                    Şablon: <span className="font-bold">{waTemplate}</span>
                  </p>
                  <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">
                    Parametre: <span className="font-semibold">{(() => { const [yr, mo] = month.split('-'); return new Date(parseInt(yr!), parseInt(mo!) - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); })()}</span>
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1.5 text-right">Şimdi</p>
                </div>
                <p className="text-[9px] text-gray-400">* Gerçek mesaj Meta'daki şablon metnine göre oluşturulur.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zamanlanmış Gönderim */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Gönderim Zamanı</p>
        {/* Geçmiş gönderim saatlerinden öneri */}
        {pastNewsletters.filter(n => n.status === 'sent' && n.sentAt).length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-1.5">Geçmiş gönderim saatleri:</p>
            <div className="flex flex-wrap gap-1.5">
              {pastNewsletters.filter(n => n.status === 'sent' && n.sentAt).slice(0, 4).map(n => {
                const d = new Date(n.sentAt!);
                const today = new Date();
                today.setHours(d.getHours(), d.getMinutes(), 0, 0);
                if (today <= new Date()) today.setDate(today.getDate() + 7);
                const suggested = today.toISOString().slice(0, 16);
                return (
                  <button key={n.id}
                    onClick={() => setScheduledAt(suggested)}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded-lg hover:bg-[#26496b]/5 hover:border-[#26496b]/30 hover:text-[#26496b] transition-colors">
                    {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ({n.title.slice(0, 15)}…)
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Zamanlanmış Tarih/Saat <span className="normal-case text-gray-300">(boş = hemen gönder)</span></label>
            <input type="datetime-local" className={inp} value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} />
          </div>
          {scheduledAt && (
            <button onClick={() => setScheduledAt('')} className="mt-5 text-[10px] text-gray-400 hover:text-red-500">✕ Temizle</button>
          )}
        </div>
        {scheduledAt && (
          <p className="text-[10px] text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
            ⏰ Bülten <strong>{new Date(scheduledAt).toLocaleString('tr-TR')}</strong> tarihinde otomatik gönderilecek.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={generatePreview}
          className="px-4 py-2 text-sm font-medium text-[#26496b] border border-[#26496b]/30 rounded-xl hover:bg-[#26496b]/5">
          👁 Önizle
        </button>
        <button disabled={saving || sending} onClick={() => void saveDraft()}
          className="px-4 py-2 text-sm font-semibold text-[#26496b] border border-[#26496b] rounded-xl hover:bg-[#26496b]/5 disabled:opacity-50">
          {saving ? 'Kaydediliyor…' : draft ? '💾 Güncelle' : '💾 Taslak Kaydet'}
        </button>
        <button disabled={saving || sending} onClick={() => void saveAndSend()}
          className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl hover:bg-[#1e3a56] disabled:opacity-50">
          {sending ? 'Gönderiliyor…' : saving ? 'Kaydediliyor…' : scheduledAt ? '⏰ Zamanla & Kaydet' : '🚀 Oluştur & Gönder'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
        <strong>Not:</strong> "Önizle" ile görmeden göndermeyin. Şablon + içerik seçiminiz anında HTML'e dönüşür.
      </div>
    </div>
  );
}

// ─── Hareketsiz Aboneler Paneli ───────────────────────────────────────────────

function CollapsiblePanel({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pt-5 pb-6 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function InactiveSubscribersPanel() {
  const [days, setDays] = useState(90);
  const [data, setData] = useState<{ count: number; emails: string[]; thresholdDays: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    try { setData(await adminApi.getInactiveSubscribers(days)); }
    catch { /* sessiz */ }
    finally { setLoading(false); }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[30, 60, 90, 180].map(d => (
          <button key={d} type="button" onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              days === d ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            Son {d} gün
          </button>
        ))}
        <button onClick={() => void check()} disabled={loading}
          className="ml-auto px-3 py-1.5 text-xs font-semibold text-[#26496b] border border-[#26496b]/30 rounded-lg hover:bg-[#26496b]/5 disabled:opacity-50">
          {loading ? 'Analiz ediliyor…' : 'Analiz Et'}
        </button>
      </div>
      {data && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center flex-1">
              <p className="text-2xl font-black text-amber-700">{data.count}</p>
              <p className="text-[10px] text-amber-500 font-semibold">son {data.thresholdDays} günde hareketsiz</p>
            </div>
            <div className="text-xs text-gray-400 flex-1">
              <p className="font-semibold text-gray-600 mb-1">Örnek:</p>
              {data.emails.slice(0, 5).map(e => <p key={e} className="font-mono truncate">{e}</p>)}
              {data.count > 5 && <p className="text-gray-300">+{data.count - 5} daha…</p>}
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Segmente Gönder modalında <strong>Son {data.thresholdDays} günde pasif</strong> filtresiyle bu gruba re-engagement bülteni gönderebilirsiniz.</p>
        </div>
      )}
    </>
  );
}

// ─── Aboneler Tab ─────────────────────────────────────────────────────────────

function AbonelerTab() {
  const [contacts, setContacts] = useState<Array<{ email: string; createdAt: string; emailBlacklisted: boolean }>>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [acting, setActing] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'liste' | 'araclar'>('liste');
  const PAGE = 50;

  // Tag management
  const [tags, setTags] = useState<Array<{ slug: string; label: string; color: string }>>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [newTag, setNewTag] = useState({ slug: '', label: '', color: '#26496b' });
  const [tagSaving, setTagSaving] = useState(false);

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; failed: number } | null>(null);

  // Welcome email settings
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeSubject, setWelcomeSubject] = useState('Haritailesi Bültenine Hoş Geldiniz!');
  const [welcomeHtml, setWelcomeHtml] = useState('');
  const [welcomeLoading, setWelcomeLoading] = useState(true);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);

  function load(off: number) {
    setLoading(true);
    adminApi.getNewsletterSubscribers(PAGE, off)
      .then(data => {
        const all: Array<{ email: string; createdAt: string; emailBlacklisted: boolean }> = data.contacts ?? [];
        setContacts(all);
        const blacklistedInPage = all.filter(c => c.emailBlacklisted).length;
        setCount((data.count ?? 0) - blacklistedInPage);
      })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(0); }, []); // eslint-disable-line

  useEffect(() => {
    adminApi.listNewsletterTags()
      .then(data => setTags(data))
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  async function addTag() {
    if (!newTag.slug.trim() || !newTag.label.trim()) return;
    setTagSaving(true);
    try {
      const created = await adminApi.createNewsletterTag(newTag);
      setTags(prev => [...prev, created]);
      setNewTag({ slug: '', label: '', color: '#26496b' });
    } catch { /* sessiz */ }
    finally { setTagSaving(false); }
  }

  async function deleteTag(slug: string) {
    if (!confirm(`"${slug}" etiketini silmek istediğinize emin misiniz?`)) return;
    await adminApi.deleteNewsletterTag(slug);
    setTags(prev => prev.filter(t => t.slug !== slug));
  }

  useEffect(() => {
    adminApi.getWelcomeSettings()
      .then(s => { setWelcomeEnabled(s.enabled); setWelcomeSubject(s.subject); setWelcomeHtml(s.html); })
      .catch(() => {})
      .finally(() => setWelcomeLoading(false));
  }, []);

  async function saveWelcomeSettings() {
    setWelcomeSaving(true);
    try {
      await adminApi.updateWelcomeSettings({ enabled: welcomeEnabled, subject: welcomeSubject, html: welcomeHtml });
      setWelcomeSaved(true);
      setTimeout(() => setWelcomeSaved(false), 2500);
    } catch { /* sessiz hata */ }
    finally { setWelcomeSaving(false); }
  }

  async function toggleBlacklist(email: string, currentlyBlacklisted: boolean) {
    setActing(email);
    try {
      const r = await adminApi.updateSubscriberStatus(email, !currentlyBlacklisted);
      if (r.ok) setContacts(prev => prev.map(c => c.email === email ? { ...c, emailBlacklisted: !currentlyBlacklisted } : c));
    } catch { /* sessiz hata */ }
    finally { setActing(null); }
  }

  async function removeContact(email: string) {
    if (!confirm(`"${email}" adresini listeden kaldırmak istediğinize emin misiniz?`)) return;
    setActing(email);
    try {
      const r = await adminApi.removeSubscriber(email);
      if (r.ok) { setContacts(prev => prev.filter(c => c.email !== email)); setCount(n => n - 1); }
    } catch { /* sessiz hata */ }
    finally { setActing(null); }
  }

  function exportCsv() {
    const rows = ['E-posta,Kayıt Tarihi,Durum', ...contacts.map(c =>
      `${c.email},${new Date(c.createdAt).toLocaleDateString('tr-TR')},${c.emailBlacklisted ? 'Devre dışı' : 'Aktif'}`
    )].join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(rows)}`;
    a.download = `aboneler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const emails = text.split(/[\r\n]+/)
        .map(line => line.split(',')[0]?.trim().toLowerCase())
        .filter((em): em is string => !!em && em.includes('@') && !em.startsWith('e-posta') && !em.startsWith('email'));
      if (emails.length === 0) { setImportResult({ added: 0, failed: 0 }); return; }
      const result = await adminApi.importSubscribers(emails);
      setImportResult(result);
      setTimeout(() => setImportResult(null), 5000);
      load(0);
    } catch { setImportResult({ added: 0, failed: -1 }); }
    finally { setImporting(false); }
  }

  return (
    <div>
      {/* Alt sekme çubuğu */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button type="button" onClick={() => setSubTab('liste')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${subTab === 'liste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Liste
            {count > 0 && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${subTab === 'liste' ? 'bg-[#26496b]/10 text-[#26496b]' : 'bg-gray-200 text-gray-500'}`}>{count}</span>}
          </button>
          <button type="button" onClick={() => setSubTab('araclar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${subTab === 'araclar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Araçlar
          </button>
        </div>

        {subTab === 'liste' && (
          <div className="flex items-center gap-2">
            {importResult && (
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${importResult.failed === -1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {importResult.failed === -1 ? 'Hata oluştu' : `${importResult.added} eklendi`}
              </span>
            )}
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => void handleImport(e)} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              {importing ? 'Yükleniyor…' : 'CSV Yükle'}
            </button>
            <button onClick={exportCsv}
              className="px-3 py-1.5 text-xs font-semibold text-[#26496b] border border-[#26496b]/30 rounded-lg hover:bg-[#26496b]/5">
              CSV İndir
            </button>
          </div>
        )}
      </div>

      {/* Liste sekmesi */}
      {subTab === 'liste' && (
        <>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white rounded-xl border border-gray-100 animate-pulse" />)}</div>
          ) : contacts.filter(c => !c.emailBlacklisted).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Abone bulunamadı.</div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['E-posta', 'Kayıt Tarihi', 'Durum', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contacts.filter(c => !c.emailBlacklisted).map((c, i) => {
                      const busy = acting === c.email;
                      return (
                        <tr key={c.email || i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-gray-700 font-mono">{c.email || <span className="text-gray-300 italic">—</span>}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Aktif</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {c.email && (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button disabled={busy}
                                  onClick={() => void toggleBlacklist(c.email, c.emailBlacklisted)}
                                  className="px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors disabled:opacity-40 text-amber-700 border-amber-200 hover:bg-amber-50">
                                  {busy ? '…' : 'Devre Dışı'}
                                </button>
                                <button disabled={busy}
                                  onClick={() => void removeContact(c.email)}
                                  className="px-2 py-1 text-[10px] font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-40">
                                  {busy ? '…' : 'Kaldır'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{offset + 1}–{Math.min(offset + PAGE, count)} / {count}</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => { const o = Math.max(0, offset - PAGE); setOffset(o); load(o); }}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Önceki</button>
                  <button disabled={offset + PAGE >= count} onClick={() => { const o = offset + PAGE; setOffset(o); load(o); }}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sonraki →</button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Araçlar sekmesi */}
      {subTab === 'araclar' && (
        <>
          <CollapsiblePanel
            title="Hareketsiz Abone Analizi"
            description="Belirli sürede Brevo'da etkileşim yapmayan aboneleri tespit edin; re-engagement kampanyası başlatın."
          >
            <InactiveSubscribersPanel />
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Segment Önizleme"
            description="Etiket, bölge ve ilgi alanına göre hedef kitle boyutunu anlık görün."
          >
            <SegmentPreviewPanel tags={tags} />
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Abone Etiketleri"
            description="Aboneleri gruplamak için renk kodlu etiketler oluşturun ve yönetin."
          >
            {tagsLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div key={tag.slug} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white" style={{ background: tag.color }}>
                      {tag.label}
                      <button onClick={() => void deleteTag(tag.slug)} className="opacity-70 hover:opacity-100 ml-0.5">✕</button>
                    </div>
                  ))}
                  {tags.length === 0 && <span className="text-xs text-gray-400">Henüz etiket yok</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 w-28"
                    placeholder="slug (ör: egitim)" value={newTag.slug}
                    onChange={e => setNewTag(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} />
                  <input className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30 flex-1"
                    placeholder="Etiket adı (ör: Eğitim)" value={newTag.label}
                    onChange={e => setNewTag(f => ({ ...f, label: e.target.value }))} />
                  <input type="color" value={newTag.color} onChange={e => setNewTag(f => ({ ...f, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer" title="Renk" />
                  <button onClick={() => void addTag()} disabled={tagSaving || !newTag.slug.trim() || !newTag.label.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg disabled:opacity-50 hover:bg-[#1d3654] transition-colors">
                    {tagSaving ? '…' : 'Ekle'}
                  </button>
                </div>
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Hoş Geldiniz E-postası"
            description="Yeni abone olunduğunda Brevo üzerinden otomatik gönderilen karşılama mesajı."
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">Otomatik gönderim</span>
              {welcomeLoading ? (
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              ) : (
                <button onClick={() => setWelcomeEnabled(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${welcomeEnabled ? 'bg-[#26496b]' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${welcomeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
            {welcomeLoading ? (
              <div className="space-y-3">
                <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Konu</label>
                  <input type="text" value={welcomeSubject} onChange={e => setWelcomeSubject(e.target.value)}
                    disabled={!welcomeEnabled}
                    className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 disabled:opacity-50"
                    placeholder="Hoş Geldiniz e-postası konusu" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">HTML İçerik</label>
                  <textarea value={welcomeHtml} onChange={e => setWelcomeHtml(e.target.value)}
                    disabled={!welcomeEnabled} rows={8}
                    className="mt-1 w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 disabled:opacity-50 resize-y"
                    placeholder="<html>...\nMerge tag'lar: {FIRSTNAME} {LASTNAME} {EMAIL}" />
                  <p className="text-[10px] text-gray-400 mt-1">Kullanılabilir merge tag'lar: <code className="bg-gray-100 px-1 rounded">{'{FIRSTNAME}'}</code> <code className="bg-gray-100 px-1 rounded">{'{LASTNAME}'}</code> <code className="bg-gray-100 px-1 rounded">{'{EMAIL}'}</code></p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => void saveWelcomeSettings()} disabled={welcomeSaving}
                    className="px-4 py-2 text-sm font-semibold bg-[#26496b] text-white rounded-xl hover:bg-[#1d3654] disabled:opacity-50 transition-colors">
                    {welcomeSaving ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                  {welcomeSaved && <span className="text-xs text-green-600 font-semibold">Kaydedildi ✓</span>}
                </div>
              </div>
            )}
          </CollapsiblePanel>
        </>
      )}
    </div>
  );
}

// ─── Segment Önizleme Paneli ──────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { id: 'haberler', label: 'Vakıf Haberleri' },
  { id: 'etkinlikler', label: 'Etkinlikler' },
  { id: 'egitimler', label: 'Eğitimler' },
  { id: 'yarismalar', label: 'Yarışmalar' },
  { id: 'projeler', label: 'Projeler' },
  { id: 'mentorluk', label: 'Mentorluk' },
];

const REGION_OPTIONS = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya',
  'Adana', 'Gaziantep', 'Mersin', 'Trabzon', 'Yurt Dışı', 'Diğer',
];

function SegmentPreviewPanel({ tags }: { tags: Array<{ slug: string; label: string; color: string }> }) {
  const [selTags, setSelTags] = useState<Set<string>>(new Set());
  const [selRegions, setSelRegions] = useState<Set<string>>(new Set());
  const [selInterests, setSelInterests] = useState<Set<string>>(new Set());
  const [behavior, setBehavior] = useState<'all' | 'active_90d' | 'inactive_90d' | 'never_opened'>('all');
  const [result, setResult] = useState<{ count: number; sample: string[]; behaviorDataAvailable: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function preview() {
    setLoading(true);
    try {
      const r = await adminApi.previewSegment({
        ...(selTags.size > 0 ? { tags: Array.from(selTags) } : {}),
        ...(selRegions.size > 0 ? { regions: Array.from(selRegions) } : {}),
        ...(selInterests.size > 0 ? { interestAreas: Array.from(selInterests) } : {}),
        ...(behavior !== 'all' ? { behavior } : {}),
      });
      setResult(r);
    } catch { /* sessiz */ }
    finally { setLoading(false); }
  }

  function toggle<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  }

  return (
    <div className="space-y-4">
        {/* Etiketler */}
        {tags.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Etiketler</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <button key={t.slug} type="button"
                  onClick={() => setSelTags(s => toggle(s, t.slug))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${selTags.has(t.slug) ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 bg-white'}`}
                  style={selTags.has(t.slug) ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bölgeler */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Bölge</p>
          <div className="flex flex-wrap gap-1.5">
            {REGION_OPTIONS.map(r => (
              <button key={r} type="button"
                onClick={() => setSelRegions(s => toggle(s, r))}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${selRegions.has(r) ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* İlgi Alanları */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">İlgi Alanları</p>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map(i => (
              <button key={i.id} type="button"
                onClick={() => setSelInterests(s => toggle(s, i.id))}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${selInterests.has(i.id) ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {/* Davranış Filtresi */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Davranış (Brevo)</p>
          <div className="flex flex-wrap gap-1.5">
            {([
              { val: 'all', label: 'Tümü' },
              { val: 'active_90d', label: '✓ Son 90 günde aktif' },
              { val: 'inactive_90d', label: '⚠ 90 günde hareketsiz' },
              { val: 'never_opened', label: '✗ Hiç açmadı' },
            ] as const).map(opt => (
              <button key={opt.val} type="button"
                onClick={() => setBehavior(opt.val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${behavior === opt.val ? 'bg-[#26496b] text-white border-[#26496b]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-300 mt-1">Davranış filtresi Brevo API üzerinden çalışır. BREVO_API_KEY gerektir.</p>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => void preview()} disabled={loading}
            className="px-4 py-2 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3654] disabled:opacity-50 transition-colors">
            {loading ? 'Hesaplanıyor…' : 'Önizle'}
          </button>
          {result !== null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#26496b]">{result.count}</span>
              <div>
                <p className="text-xs text-gray-600">abone seçildi</p>
                {result.sample.length > 0 && (
                  <p className="text-[9px] text-gray-400 mt-0.5">{result.sample.join(', ')}{result.count > result.sample.length ? ` +${result.count - result.sample.length} daha` : ''}</p>
                )}
                {behavior !== 'all' && !result.behaviorDataAvailable && (
                  <p className="text-[9px] text-orange-400 mt-0.5">⚠ Brevo API yanıt vermedi, davranış filtresi uygulanamadı</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

// ─── Otomasyonlar Tab ─────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  welcome: '👋 Hoş Geldiniz',
  welcome_series: '📬 Hoş Geldiniz Serisi (3 adım)',
  member_approved: '✅ Üyelik Onayı',
  event_registered: '📅 Etkinlik Kaydı',
  training_enrolled: '🎓 Eğitime Kayıt',
  inactivity_30d: '💤 30 Gün Hareketsizlik',
  inactivity_90d: '💤 90 Gün Hareketsizlik (Re-engagement)',
  birthday: '🎂 Doğum Günü',
  membership_expiring: '⚠️ Üyelik Süresi Dolmak Üzere',
  competition_registered: '🏆 Yarışmaya Kayıt',
};

const DEFAULT_AUTOMATIONS = [
  {
    name: 'Hoş Geldiniz Serisi',
    description: 'Yeni abone olunduğunda 0/3/7. günlerde gönderilen drip serisi',
    triggerType: 'welcome_series',
    steps: [
      { delayDays: 0, subject: 'Haritailesi\'ye Hoş Geldiniz! 👋', htmlBody: '<p>Merhaba {FIRSTNAME},</p><p>Haritailesi Vakfı bültenine abone olduğunuz için teşekkürler!</p>', previewText: 'Bültene hoş geldiniz' },
      { delayDays: 3, subject: 'Haritailesi\'yi Keşfedin 🗺️', htmlBody: '<p>Merhaba {FIRSTNAME},</p><p>Sahne üzerinden etkinlik, eğitim ve daha fazlasına ulaşabilirsiniz.</p>', previewText: 'Sahne platformunu tanıyın' },
      { delayDays: 7, subject: 'Topluluğa Katılın ⭐', htmlBody: '<p>Merhaba {FIRSTNAME},</p><p>Sizi topluluk üyeleri arasında görmek isteriz!</p>', previewText: 'Haritailesi topluluğuna katılın' },
    ],
  },
  {
    name: 'Üyelik Onayı E-postası',
    description: 'Başvurusu onaylanan yeni üyelere gönderilir',
    triggerType: 'member_approved',
    steps: [
      { delayDays: 0, subject: 'Haritailesi Vakfı\'na Hoş Geldiniz!', htmlBody: '<p>Sayın {FIRSTNAME},</p><p>Üyeliğiniz onaylandı. Artık Mutfak platformuna erişebilirsiniz.</p>', previewText: 'Üyeliğiniz onaylandı' },
    ],
  },
];

function OtomasyonlarTab() {
  const [automations, setAutomations] = useState<NewsletterAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<import('@/lib/api').AutomationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', triggerType: 'welcome_series' });
  const [rightView, setRightView] = useState<'flow' | 'logs'>('flow');
  const [editingSteps, setEditingSteps] = useState<AutomationStep[] | null>(null);
  const [stepsSaving, setStepsSaving] = useState(false);

  useEffect(() => {
    adminApi.listAutomations()
      .then(data => setAutomations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadLogs(id: string) {
    setSelectedId(id);
    setLogsLoading(true);
    const automation = automations.find(a => a.id === id);
    setEditingSteps(automation ? [...(automation.steps as AutomationStep[])] : null);
    adminApi.getAutomationLogs(id)
      .then(data => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }

  async function saveSteps() {
    if (!selectedId || !editingSteps) return;
    setStepsSaving(true);
    try {
      const updated = await adminApi.updateAutomation(selectedId, { steps: editingSteps });
      setAutomations(prev => prev.map(a => a.id === selectedId ? updated : a));
    } catch { /* sessiz */ }
    finally { setStepsSaving(false); }
  }

  function updateStep(idx: number, patch: Partial<AutomationStep>) {
    setEditingSteps(prev => prev ? prev.map((s, i) => i === idx ? { ...s, ...patch } : s) : prev);
  }

  function addStep() {
    setEditingSteps(prev => prev ? [...prev, { delayDays: 1, subject: 'Yeni E-posta', htmlBody: '<p>İçerik</p>' }] : prev);
  }

  function removeStep(idx: number) {
    setEditingSteps(prev => prev ? prev.filter((_, i) => i !== idx) : prev);
  }

  async function toggleStatus(a: NewsletterAutomation) {
    const next = a.status === 'active' ? 'paused' : 'active';
    const updated = await adminApi.setAutomationStatus(a.id, next);
    setAutomations(prev => prev.map(x => x.id === a.id ? updated : x));
  }

  async function remove(id: string) {
    if (!confirm('Bu otomasyonu silmek istediğinize emin misiniz?')) return;
    await adminApi.deleteAutomation(id);
    setAutomations(prev => prev.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function seedDefault(def: typeof DEFAULT_AUTOMATIONS[0]) {
    setCreating(true);
    try {
      const created = await adminApi.createAutomation({ name: def.name, description: def.description, triggerType: def.triggerType, steps: def.steps });
      setAutomations(prev => [created, ...prev]);
    } catch { /* sessiz hata */ }
    finally { setCreating(false); }
  }

  async function createNew() {
    if (!newForm.name.trim()) return;
    setCreating(true);
    try {
      const created = await adminApi.createAutomation({
        name: newForm.name, triggerType: newForm.triggerType,
        ...(newForm.description ? { description: newForm.description } : {}),
        steps: [{ delayDays: 0, subject: 'Konu', htmlBody: '<p>İçerik</p>' }],
      });
      setAutomations(prev => [created, ...prev]);
      setShowNew(false);
      setNewForm({ name: '', description: '', triggerType: 'welcome_series' });
    } catch { /* sessiz hata */ }
    finally { setCreating(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-gray-900">E-posta Otomasyonları</p>
          <p className="text-xs text-gray-400 mt-0.5">Tetikleyici bazlı otomatik e-posta akışları</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1d3654] transition-colors">
          + Otomasyon Ekle
        </button>
      </div>

      {/* Yeni otomasyon formu */}
      {showNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-xs font-bold text-blue-800">Yeni Otomasyon</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30"
              placeholder="Otomasyon adı" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
            <select className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-white"
              value={newForm.triggerType} onChange={e => setNewForm(f => ({ ...f, triggerType: e.target.value }))}>
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="col-span-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              placeholder="Açıklama (opsiyonel)" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void createNew()} disabled={creating}
              className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg disabled:opacity-50">
              {creating ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
            <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">İptal</button>
          </div>
        </div>
      )}

      {/* Hazır şablonlar */}
      {automations.length === 0 && !loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Hazır Başlangıç Otomasyonları</p>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_AUTOMATIONS.map(def => (
              <button key={def.triggerType} onClick={() => void seedDefault(def)} disabled={creating}
                className="text-left p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#26496b]/40 hover:bg-[#26496b]/5 transition-all disabled:opacity-50">
                <p className="text-xs font-bold text-gray-800">{TRIGGER_LABELS[def.triggerType]}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{def.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{def.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        {/* Otomasyon listesi */}
        <div className="col-span-2 space-y-2">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)
          ) : automations.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Henüz otomasyon yok</div>
          ) : automations.map(a => (
            <div key={a.id}
              onClick={() => void loadLogs(a.id)}
              className={`bg-white rounded-xl border-2 p-3 cursor-pointer transition-all ${selectedId === a.id ? 'border-[#26496b] shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{a.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{TRIGGER_LABELS[a.triggerType] ?? a.triggerType}</p>
                  <p className="text-[10px] text-gray-400">{(a.steps as AutomationStep[]).length} adım</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.status === 'active' ? 'Aktif' : a.status === 'paused' ? 'Durduruldu' : 'Arşiv'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); void toggleStatus(a); }}
                      className="text-[9px] px-1 py-0.5 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                      {a.status === 'active' ? 'Durdur' : 'Başlat'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); void remove(a.id); }}
                      className="text-[9px] px-1 py-0.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sağ panel: Akış veya Log */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-4">
          {selectedId && (
            <div className="flex gap-1 mb-4">
              {(['flow', 'logs'] as const).map(v => (
                <button key={v} onClick={() => setRightView(v)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${rightView === v ? 'bg-[#26496b] text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                  {v === 'flow' ? '⚙ Akış Editörü' : '📋 Gönderim Logları'}
                </button>
              ))}
            </div>
          )}
          {!selectedId ? (
            <div className="flex items-center justify-center h-40 text-xs text-gray-400">
              Bir otomasyon seçin
            </div>
          ) : rightView === 'flow' ? (
            /* ── Görsel Akış Editörü ── */
            <div className="overflow-y-auto max-h-[500px]">
              {/* Tetikleyici Düğümü */}
              {(() => {
                const auto = automations.find(a => a.id === selectedId);
                return auto ? (
                  <div className="flex justify-center mb-1">
                    <div className="bg-[#26496b] text-white rounded-xl px-4 py-2 text-center shadow-sm">
                      <p className="text-[9px] uppercase tracking-widest opacity-60">Tetikleyici</p>
                      <p className="text-xs font-bold mt-0.5">{TRIGGER_LABELS[auto.triggerType] ?? auto.triggerType}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Adım Listesi */}
              {(editingSteps ?? []).map((step, idx) => (
                <div key={idx}>
                  {/* Ok */}
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center py-1">
                      <div className="w-px h-4 bg-gray-200" />
                      {step.delayDays > 0 && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          +{step.delayDays} gün
                        </span>
                      )}
                      <div className="w-px h-4 bg-gray-200" />
                    </div>
                  </div>

                  {/* Adım Kartı */}
                  <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Adım {idx + 1}</span>
                      <button onClick={() => removeStep(idx)}
                        className="text-[9px] text-red-400 hover:text-red-600 transition-colors">✕ Kaldır</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[9px] text-gray-400 mb-0.5">Gecikme (gün)</p>
                        <input type="number" min={0} value={step.delayDays}
                          onChange={e => updateStep(idx, { delayDays: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30" />
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 mb-0.5">E-posta Konusu</p>
                        <input type="text" value={step.subject}
                          onChange={e => updateStep(idx, { subject: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">Önizleme Metni</p>
                      <input type="text" value={step.previewText ?? ''}
                        onChange={e => {
                          if (e.target.value) { updateStep(idx, { previewText: e.target.value }); }
                          else { setEditingSteps(prev => prev ? prev.map((s, i) => { if (i !== idx) return s; const { previewText: _pt, ...rest } = s; return rest as AutomationStep; }) : prev); }
                        }}
                        placeholder="Opsiyonel kısa açıklama"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#26496b]/30" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 mb-0.5">HTML İçerik</p>
                      <TiptapEditor value={step.htmlBody} onChange={html => updateStep(idx, { htmlBody: html })} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Ekle + Kaydet */}
              <div className="flex justify-center mt-2">
                <div className="w-px h-4 bg-gray-200" />
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <button onClick={addStep}
                  className="px-3 py-1.5 text-xs font-medium border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#26496b] hover:text-[#26496b] transition-colors">
                  + Adım Ekle
                </button>
                <button onClick={() => void saveSteps()} disabled={stepsSaving}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-xl hover:bg-[#1d3654] disabled:opacity-50 transition-colors">
                  {stepsSaving ? 'Kaydediliyor…' : '💾 Kaydet'}
                </button>
              </div>
            </div>
          ) : logsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-gray-400">
              Henüz log yok
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Son Gönderimler</p>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-50">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'sent' ? 'bg-green-400' : log.status === 'failed' ? 'bg-red-400' : log.status === 'queued' ? 'bg-blue-300' : 'bg-gray-200'}`} />
                    <span className="text-gray-600 font-mono text-[10px] truncate flex-1">{log.subscriberEmail}</span>
                    <span className="text-gray-400 text-[9px] shrink-0">Adım {log.stepIndex + 1}</span>
                    <span className={`text-[9px] shrink-0 ${log.status === 'sent' ? 'text-green-600' : log.status === 'failed' ? 'text-red-500' : 'text-blue-500'}`}>
                      {log.status === 'sent' ? '✓ Gönderildi' : log.status === 'failed' ? '✕ Hata' : log.status === 'queued' ? '⏳ Bekliyor' : 'Atlandı'}
                    </span>
                    <span className="text-gray-300 text-[9px] shrink-0">{new Date(log.scheduledAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analitik Tab ─────────────────────────────────────────────────────────────

type CampaignStat = {
  id: string;
  title: string;
  month: string;
  subject: string;
  sentAt: string | null;
  delivered: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  unsubscriptions: number;
  hardBounces: number;
  softBounces: number;
};

function AnalitikTab() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [growth, setGrowth] = useState<{ totalNewThisMonth: number; weeks: Array<{ label: string; count: number }> } | null>(null);

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const all = await adminApi.listNewsletters();
      const sent = all.filter(n => n.sentAt).slice(0, 12);

      adminApi.getBrevoContactsCount()
        .then(r => setSubscriberCount(r.count))
        .catch(() => {});

      adminApi.getBrevoGrowth()
        .then(r => setGrowth(r))
        .catch(() => {});

      const results = await Promise.allSettled(
        sent.map(n => adminApi.getNewsletterStats(n.id).then(s => ({ n, s }))),
      );

      type StatsEntry = { n: Newsletter; s: { delivered: number; opens: number; clicks: number; openRate: number; clickRate: number; unsubscriptions: number; hardBounces: number; softBounces: number } | null };
      const rows: CampaignStat[] = results
        .flatMap(r => r.status === 'fulfilled' ? [r.value as StatsEntry] : [])
        .map(({ n, s }) => ({
          id: n.id,
          title: n.title,
          month: n.month,
          subject: n.subject,
          sentAt: n.sentAt ?? null,
          delivered: s?.delivered ?? 0,
          opens: s?.opens ?? 0,
          clicks: s?.clicks ?? 0,
          openRate: s?.openRate ?? 0,
          clickRate: s?.clickRate ?? 0,
          unsubscriptions: s?.unsubscriptions ?? 0,
          hardBounces: s?.hardBounces ?? 0,
          softBounces: s?.softBounces ?? 0,
        }))
        .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));

      setCampaigns(rows);
    } catch { /* sessiz */ }
    finally { setLoading(false); }
  }

  const avgOpen = campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => s + c.openRate, 0) / campaigns.length) : 0;
  const avgClick = campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => s + c.clickRate, 0) / campaigns.length) : 0;
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0);
  const maxOpen = Math.max(...campaigns.map(c => c.openRate), 1);

  // Delta: her kampanyayı bir öncekiyle karşılaştır (tarihe göre sıralı — en yeni[0])
  function getDelta(idx: number, key: 'openRate' | 'clickRate'): number | null {
    if (idx >= campaigns.length - 1) return null;
    const curr = campaigns[idx]?.[key] ?? 0;
    const prev = campaigns[idx + 1]?.[key] ?? 0;
    return Math.round((curr - prev) * 10) / 10;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-[#26496b]">{subscriberCount ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Toplam Abone</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-[#26496b]">{campaigns.length}</p>
          <p className="text-xs text-gray-400 mt-1">Gönderilen Bülten</p>
        </div>
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-center">
          <p className="text-3xl font-black text-blue-700">{avgOpen}%</p>
          <p className="text-xs text-blue-400 mt-1">Ort. Açılma Oranı</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
          <p className="text-3xl font-black text-green-700">{avgClick}%</p>
          <p className="text-xs text-green-400 mt-1">Ort. Tıklama Oranı</p>
        </div>
        {campaigns.length > 0 && (() => {
          const totalBounces = campaigns.reduce((s, c) => s + (c.hardBounces ?? 0) + (c.softBounces ?? 0), 0);
          const totalDel = campaigns.reduce((s, c) => s + c.delivered, 0);
          const bounceRate = totalDel > 0 ? Math.round((totalBounces / totalDel) * 1000) / 10 : 0;
          return (
            <div className={`rounded-2xl border p-4 text-center ${bounceRate > 2 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className={`text-3xl font-black ${bounceRate > 2 ? 'text-red-600' : 'text-gray-600'}`}>{bounceRate}%</p>
              <p className={`text-xs mt-1 ${bounceRate > 2 ? 'text-red-400' : 'text-gray-400'}`}>Bounce Oranı {bounceRate > 2 ? '⚠' : ''}</p>
            </div>
          );
        })()}
      </div>

      {growth && growth.weeks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Haftalık Abone Aktivitesi</p>
            {growth.totalNewThisMonth > 0 && (
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                +{growth.totalNewThisMonth} bu ay
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 h-20">
            {(() => {
              const maxCount = Math.max(...growth.weeks.map(w => w.count), 1);
              return growth.weeks.map(w => (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-bold">{w.count > 0 ? w.count : ''}</span>
                  <div className="w-full rounded-t-md bg-[#26496b] transition-all duration-500"
                    style={{ height: `${Math.max((w.count / maxCount) * 56, w.count > 0 ? 8 : 3)}px` }} />
                  <span className="text-[9px] text-gray-400 text-center leading-tight">{w.label}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400 text-sm">Henüz gönderilmiş bülten yok.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Açılma Oranı Trendi</p>
            <div className="space-y-2">
              {campaigns.slice(0, 8).reverse().map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 w-14 shrink-0 text-right">{c.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-[#26496b] transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((c.openRate / maxOpen) * 100, 4)}%` }}
                    >
                      <span className="text-[9px] text-white font-bold">{c.openRate > 5 ? `${c.openRate}%` : ''}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#26496b] w-8 shrink-0">{c.openRate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Kampanya Detayları</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2 text-gray-400 font-medium">Başlık</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-medium">Ulaştı</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-medium">Açılma</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-medium">Tıklama</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-medium">Bounce</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-medium">Çıkış</th>
                    <th className="text-right px-5 py-2 text-gray-400 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, idx) => {
                    const openDelta = getDelta(idx, 'openRate');
                    const clickDelta = getDelta(idx, 'clickRate');
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 truncate max-w-[180px]">{c.title}</p>
                          <p className="text-gray-400 text-[10px] truncate max-w-[180px]">{c.subject}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-600 font-mono">{c.delivered.toLocaleString('tr')}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-bold ${c.openRate >= 30 ? 'text-green-600' : c.openRate >= 20 ? 'text-blue-600' : 'text-gray-500'}`}>
                              {c.openRate}%
                            </span>
                            {openDelta !== null && (
                              <span className={`text-[9px] font-bold ${openDelta > 0 ? 'text-green-500' : openDelta < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                {openDelta > 0 ? `▲${openDelta}` : openDelta < 0 ? `▼${Math.abs(openDelta)}` : '—'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-bold ${c.clickRate >= 5 ? 'text-green-600' : 'text-gray-500'}`}>
                              {c.clickRate}%
                            </span>
                            {clickDelta !== null && (
                              <span className={`text-[9px] font-bold ${clickDelta > 0 ? 'text-green-500' : clickDelta < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                {clickDelta > 0 ? `▲${clickDelta}` : clickDelta < 0 ? `▼${Math.abs(clickDelta)}` : '—'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {(c.hardBounces + c.softBounces) > 0 ? (
                            <span className="text-red-500 font-semibold">{c.hardBounces + c.softBounces}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-400">{c.unsubscriptions}</td>
                        <td className="px-5 py-3 text-right text-gray-400 font-mono text-[10px]">
                          {c.sentAt ? new Date(c.sentAt).toLocaleDateString('tr-TR') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">Toplam {totalDelivered.toLocaleString('tr')} e-posta ulaştı • Son {campaigns.length} kampanya</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
