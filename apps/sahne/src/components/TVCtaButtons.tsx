'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HikayeniPaylasModal } from './HikayeniPaylas';
import { YetenekGonderModal } from './YetenekGonder';

const CARD: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  padding: '10px 14px', borderRadius: 14, cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  textAlign: 'left', textDecoration: 'none',
  transition: 'background 0.15s',
  flex: 1,
};

export function TVCtaButtons() {
  const [hikayeOpen, setHikayeOpen] = useState(false);
  const [yetenekOpen, setYetenekOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0, width: 340 }}>

        <button onClick={() => setHikayeOpen(true)} style={{ ...CARD, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✍️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', lineHeight: 1.2 }}>Hikayeni Paylaş</span>
          </div>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Topluluğa ilham ver</span>
        </button>

        <button onClick={() => setYetenekOpen(true)} style={{ ...CARD, border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🎸</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', lineHeight: 1.2 }}>Yeteneğini Paylaş</span>
          </div>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Becerinle öne çık</span>
        </button>

        <Link href="/mentorluk#basvuru" target="_blank" rel="noopener noreferrer" style={{ ...CARD, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🌟</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', lineHeight: 1.2 }}>Mentör Ol</span>
          </div>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Deneyimini aktar</span>
        </Link>

        <Link href="/mentorluk#basvuru" target="_blank" rel="noopener noreferrer" style={{ ...CARD, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🎓</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', lineHeight: 1.2 }}>Mentee Ol</span>
          </div>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Bir ustadan öğren</span>
        </Link>

      </div>

      {hikayeOpen && <HikayeniPaylasModal onClose={() => setHikayeOpen(false)} />}
      {yetenekOpen && <YetenekGonderModal onClose={() => setYetenekOpen(false)} />}
    </>
  );
}
