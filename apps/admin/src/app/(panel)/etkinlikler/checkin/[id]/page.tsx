'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { adminApi } from '@/lib/api';

type CheckinResult = { success: boolean; displayName: string | null; alreadyCheckedIn: boolean; registrationType: string };

export default function CheckinPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const lastScanned = useRef('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stream?.getTracks().forEach((t) => t.stop());
    setCameraReady(false);
  }, [stream]);

  useEffect(() => {
    if (mode === 'camera') startCamera();
    return () => stopCamera();
  }, [mode]); // eslint-disable-line

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        setCameraReady(true);
        scan();
      }
    } catch {
      setError('Kameraya erişilemiyor. Manuel giriş kullanın.');
      setMode('manual');
    }
  }

  function scan() {
    rafRef.current = requestAnimationFrame(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) { scan(); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { scan(); return; }
      ctx.drawImage(video, 0, 0);

      // 1) BarcodeDetector (Chrome/Edge — hızlı)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('BarcodeDetector' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const det = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const codes = await det.detect(canvas) as Array<{ rawValue: string }>;
          if (codes.length > 0) {
            await handleCode(codes[0]!.rawValue);
            return;
          }
        } catch { /* fall through to jsQR */ }
      }

      // 2) jsQR polyfill (Safari, Firefox, iOS — her yerde çalışır)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        await handleCode(code.data);
        return;
      }

      if (!scanning) scan();
    });
  }

  async function handleCode(raw: string) {
    if (scanning) return;
    if (raw === lastScanned.current) { scan(); return; }

    // URL'den ticket code çıkar: …/bilet/<uuid>
    const match = raw.match(/\/bilet\/([a-f0-9-]{36})/i);
    const code = match?.[1] ?? raw;

    lastScanned.current = raw;
    await handleCheckin(code);
    // 3 sn sonra tekrar taramaya izin ver
    setTimeout(() => { lastScanned.current = ''; if (!result && !error) scan(); }, 3000);
  }

  async function handleCheckin(ticketCode: string) {
    setScanning(true);
    setResult(null);
    setError(null);
    try {
      const r = await adminApi.checkinByTicket(ticketCode);
      setResult(r);
      stopCamera();
    } catch (e) {
      setError((e as Error).message ?? 'Bilet bulunamadı');
      stopCamera();
    } finally {
      setScanning(false);
    }
  }

  function resetResult() {
    setResult(null);
    setError(null);
    setManualCode('');
    lastScanned.current = '';
    if (mode === 'camera') startCamera();
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-6">
        <a href="/etkinlikler" className="text-sm text-[#26496b] hover:underline">← Etkinlikler</a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Kapı Check-in</h1>
        <p className="text-sm text-gray-500">QR bilet tarayın veya kodu manuel girin.</p>
      </div>

      {/* Mod seçici */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-4">
        <button onClick={() => { setMode('camera'); resetResult(); }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
          📷 Kamera
        </button>
        <button onClick={() => { setMode('manual'); stopCamera(); resetResult(); }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-[#26496b] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
          ⌨️ Manuel
        </button>
      </div>

      {/* Sonuç */}
      {result && (
        <div className={`rounded-2xl p-5 mb-4 text-center ${result.alreadyCheckedIn ? 'bg-amber-50 border-2 border-amber-300' : 'bg-emerald-50 border-2 border-emerald-400'}`}>
          <p className="text-3xl mb-2">{result.alreadyCheckedIn ? '⚠️' : '✅'}</p>
          <p className={`text-lg font-black ${result.alreadyCheckedIn ? 'text-amber-700' : 'text-emerald-700'}`}>
            {result.alreadyCheckedIn ? 'Daha önce giriş yaptı!' : 'Başarılı giriş!'}
          </p>
          <p className="text-base font-semibold text-gray-800 mt-1">{result.displayName ?? 'Misafir'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{result.registrationType === 'public' ? 'Anonim kayıt' : 'Üye'}</p>
          <button onClick={resetResult} className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
            Sonraki Tarama
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-2xl p-5 mb-4 text-center bg-red-50 border-2 border-red-300">
          <p className="text-3xl mb-2">❌</p>
          <p className="text-lg font-black text-red-700">Bilet Geçersiz</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <button onClick={resetResult} className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Kamera görünümü */}
      {mode === 'camera' && !result && !error && (
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square">
          <video
            ref={videoRef}
            playsInline muted autoPlay
            className="w-full h-full object-cover"
          />
          {/* jsQR için gizli canvas */}
          <canvas ref={canvasRef} className="hidden" />
          {/* Tarama çerçevesi */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 border-2 border-white rounded-2xl opacity-70" />
          </div>
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
          {scanning && (
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">İşleniyor…</span>
            </div>
          )}
          {cameraReady && !scanning && (
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/40 text-white/80 text-xs px-3 py-1.5 rounded-full">QR kodu çerçeveye hizalayın</span>
            </div>
          )}
        </div>
      )}

      {/* Manuel giriş */}
      {mode === 'manual' && !result && !error && (
        <div className="space-y-3">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 font-mono tracking-widest uppercase"
            placeholder="BİLET KODU"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualCode.trim()) void handleCheckin(manualCode.trim()); }}
            autoFocus
          />
          <button
            disabled={!manualCode.trim() || scanning}
            onClick={() => void handleCheckin(manualCode.trim())}
            className="w-full py-3 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a56] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {scanning && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {scanning ? 'Kontrol ediliyor…' : 'Giriş Yap'}
          </button>
        </div>
      )}
    </div>
  );
}
