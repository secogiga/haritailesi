import { describe, it, expect } from 'vitest';
import { calculateLevel, levelProgress, LEVEL_META, LEVEL_ORDER } from '@/lib/level';

// ── calculateLevel ────────────────────────────────────────────────────────────

describe('calculateLevel', () => {
  it('hiç aksiyon yoksa izleyici döner', () => {
    expect(calculateLevel([])).toBe('izleyici');
  });

  it('sadece v- aksiyonlarıyla izleyici döner', () => {
    expect(calculateLevel(['v-etkinlikler', 'v-mentorluk', 'v-egitim'])).toBe('izleyici');
  });

  it('3+ p- aksiyonuyla katilimci döner', () => {
    expect(calculateLevel(['p-mentor', 'p-etkinlik', 'p-anket'])).toBe('katilimci');
  });

  it('2 p- aksiyonu eşik altında — izleyici kalır', () => {
    expect(calculateLevel(['p-mentor', 'p-etkinlik'])).toBe('izleyici');
  });

  it('2+ c- aksiyonuyla katki_sunan döner', () => {
    expect(calculateLevel(['c-gonderi', 'c-gorus'])).toBe('katki_sunan');
  });

  it('1 c- aksiyonu eşik altında', () => {
    expect(calculateLevel(['c-gonderi'])).toBe('izleyici');
  });

  it('1 d- aksiyonuyla etki_yaratan döner', () => {
    expect(calculateLevel(['d-mentor-seans'])).toBe('etki_yaratan');
  });

  it('etki_yaratan en yüksek öncelik — diğer prefixler varken bile', () => {
    expect(calculateLevel(['d-proje', 'c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
      .toBe('etki_yaratan');
  });

  it('katki_sunan, katilimci\'dan önce gelir', () => {
    expect(calculateLevel(['c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
      .toBe('katki_sunan');
  });

  it('API\'deki kanonik mantıkla birebir senkron (referans vektör)', () => {
    // Bu test kasıtlı olarak API level.utils.ts ile aynı sonucu vermeli
    const cases: [string[], string][] = [
      [[], 'izleyici'],
      [['v-etkinlikler', 'v-mentorluk', 'v-egitim', 'v-hgenc'], 'izleyici'],
      [['p-mentor', 'p-etkinlik', 'p-anket'], 'katilimci'],
      [['c-gonderi', 'c-gorus'], 'katki_sunan'],
      [['d-mentor-seans'], 'etki_yaratan'],
    ];
    for (const [ids, expected] of cases) {
      expect(calculateLevel(ids)).toBe(expected);
    }
  });
});

// ── levelProgress ─────────────────────────────────────────────────────────────

describe('levelProgress', () => {
  it('izleyici için v- aksiyonlarını sayar, min=4', () => {
    const result = levelProgress(['v-etkinlikler', 'v-mentorluk'], 'izleyici');
    expect(result.done).toBe(2);
    expect(result.total).toBe(4);
    expect(result.pct).toBe(50);
  });

  it('katilimci için p- aksiyonlarını sayar, min=3', () => {
    const result = levelProgress(['p-mentor', 'p-etkinlik', 'p-anket'], 'katilimci');
    expect(result.done).toBe(3);
    expect(result.total).toBe(3);
    expect(result.pct).toBe(100);
  });

  it('katki_sunan için c- aksiyonlarını sayar, min=2', () => {
    const result = levelProgress(['c-gonderi'], 'katki_sunan');
    expect(result.done).toBe(1);
    expect(result.total).toBe(2);
    expect(result.pct).toBe(50);
  });

  it('etki_yaratan için d- aksiyonlarını sayar, min=1', () => {
    const result = levelProgress(['d-proje'], 'etki_yaratan');
    expect(result.done).toBe(1);
    expect(result.total).toBe(1);
    expect(result.pct).toBe(100);
  });

  it('pct 100\'ü aşmaz', () => {
    const result = levelProgress(
      ['p-mentor', 'p-etkinlik', 'p-anket', 'p-mentor', 'p-bagis'],
      'katilimci',
    );
    expect(result.pct).toBe(100);
  });

  it('yanlış prefix aksiyonları saymaz', () => {
    const result = levelProgress(['v-etkinlikler', 'v-mentorluk', 'v-egitim'], 'katilimci');
    expect(result.done).toBe(0);
    expect(result.pct).toBe(0);
  });
});

// ── LEVEL_META ve LEVEL_ORDER tutarlılığı ────────────────────────────────────

describe('LEVEL_META ve LEVEL_ORDER', () => {
  it('LEVEL_ORDER 4 kademe içerir, artan sırada', () => {
    expect(LEVEL_ORDER).toEqual(['izleyici', 'katilimci', 'katki_sunan', 'etki_yaratan']);
  });

  it('her kademedeki no değeri sırasıyla 1-2-3-4', () => {
    LEVEL_ORDER.forEach((id, i) => {
      expect(LEVEL_META[id].no).toBe(i + 1);
    });
  });

  it('min eşikleri doğru: 4/3/2/1', () => {
    expect(LEVEL_META.izleyici.min).toBe(4);
    expect(LEVEL_META.katilimci.min).toBe(3);
    expect(LEVEL_META.katki_sunan.min).toBe(2);
    expect(LEVEL_META.etki_yaratan.min).toBe(1);
  });

  it('prefix\'ler doğru atanmış', () => {
    expect(LEVEL_META.izleyici.prefix).toBe('v-');
    expect(LEVEL_META.katilimci.prefix).toBe('p-');
    expect(LEVEL_META.katki_sunan.prefix).toBe('c-');
    expect(LEVEL_META.etki_yaratan.prefix).toBe('d-');
  });
});
