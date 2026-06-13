import { calculateLevel, VALID_ACTION_IDS } from '../users/level.utils';

// ── calculateLevel (level.utils) ──────────────────────────────────────────────

describe('calculateLevel', () => {
  it('returns izleyici when no actions completed', () => {
    expect(calculateLevel([])).toBe('izleyici');
  });

  it('returns izleyici when only v- actions present', () => {
    expect(calculateLevel(['v-etkinlikler', 'v-mentorluk', 'v-egitim'])).toBe('izleyici');
  });

  it('returns katilimci when 3+ p- actions present', () => {
    expect(calculateLevel(['p-mentor', 'p-etkinlik', 'p-anket'])).toBe('katilimci');
  });

  it('returns izleyici when only 2 p- actions (threshold not met)', () => {
    expect(calculateLevel(['p-mentor', 'p-etkinlik'])).toBe('izleyici');
  });

  it('returns katki_sunan when 2+ c- actions present', () => {
    expect(calculateLevel(['c-gonderi', 'c-gorus'])).toBe('katki_sunan');
  });

  it('returns izleyici when only 1 c- action (threshold not met)', () => {
    expect(calculateLevel(['c-gonderi'])).toBe('izleyici');
  });

  it('returns etki_yaratan when 1+ d- actions present', () => {
    expect(calculateLevel(['d-mentor-seans'])).toBe('etki_yaratan');
  });

  it('etki_yaratan takes priority over katki_sunan and katilimci', () => {
    expect(calculateLevel(['d-proje', 'c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
      .toBe('etki_yaratan');
  });

  it('katki_sunan takes priority over katilimci', () => {
    expect(calculateLevel(['c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
      .toBe('katki_sunan');
  });

  it('is deterministic for same input', () => {
    const ids = ['v-etkinlikler', 'p-mentor', 'p-etkinlik', 'p-anket', 'c-gonderi', 'c-gorus'];
    expect(calculateLevel(ids)).toBe('katki_sunan');
    expect(calculateLevel(ids)).toBe('katki_sunan');
  });
});

// ── VALID_ACTION_IDS ──────────────────────────────────────────────────────────

describe('VALID_ACTION_IDS', () => {
  it('contains known v- action IDs', () => {
    expect(VALID_ACTION_IDS.has('v-etkinlikler')).toBe(true);
    expect(VALID_ACTION_IDS.has('v-mentorluk')).toBe(true);
    expect(VALID_ACTION_IDS.has('v-forum')).toBe(true);
  });

  it('contains known p- action IDs', () => {
    expect(VALID_ACTION_IDS.has('p-mentor')).toBe(true);
    expect(VALID_ACTION_IDS.has('p-etkinlik')).toBe(true);
  });

  it('contains known c- action IDs', () => {
    expect(VALID_ACTION_IDS.has('c-gonderi')).toBe(true);
    expect(VALID_ACTION_IDS.has('c-sc-cevap')).toBe(true);
  });

  it('contains known d- action IDs', () => {
    expect(VALID_ACTION_IDS.has('d-mentor-seans')).toBe(true);
    expect(VALID_ACTION_IDS.has('d-proje')).toBe(true);
  });

  it('rejects unknown action IDs', () => {
    expect(VALID_ACTION_IDS.has('x-fake')).toBe(false);
    expect(VALID_ACTION_IDS.has('')).toBe(false);
    expect(VALID_ACTION_IDS.has('v-unknown-page')).toBe(false);
    expect(VALID_ACTION_IDS.has('__proto__')).toBe(false);
  });

  it('has entries for all four prefixes', () => {
    const prefixes = ['v-', 'p-', 'c-', 'd-'];
    for (const prefix of prefixes) {
      const found = [...VALID_ACTION_IDS].some(id => id.startsWith(prefix));
      expect(found).toBe(true);
    }
  });
});

// ── getLevelStats distribution logic ──────────────────────────────────────────

describe('getLevelStats distribution calculation', () => {
  function buildDistribution(userActions: Record<string, string[]>) {
    const dist = { izleyici: 0, katilimci: 0, katki_sunan: 0, etki_yaratan: 0 };
    for (const ids of Object.values(userActions)) {
      dist[calculateLevel(ids)]++;
    }
    return dist;
  }

  it('counts untracked users as izleyici', () => {
    const dist = buildDistribution({
      'user-a': ['v-etkinlikler'],
      'user-b': ['p-mentor', 'p-etkinlik', 'p-anket'],
    });
    // user-a: izleyici, user-b: katilimci
    expect(dist.izleyici).toBe(1);
    expect(dist.katilimci).toBe(1);
    expect(dist.katki_sunan).toBe(0);
    expect(dist.etki_yaratan).toBe(0);
  });

  it('correctly distributes mixed level users', () => {
    const dist = buildDistribution({
      'u1': ['v-etkinlikler'],
      'u2': ['p-mentor', 'p-etkinlik', 'p-anket'],
      'u3': ['c-gonderi', 'c-gorus'],
      'u4': ['d-mentor-seans'],
    });
    expect(dist.izleyici).toBe(1);
    expect(dist.katilimci).toBe(1);
    expect(dist.katki_sunan).toBe(1);
    expect(dist.etki_yaratan).toBe(1);
  });

  it('user with only 2 p- actions stays at izleyici', () => {
    const dist = buildDistribution({
      'u1': ['p-mentor', 'p-etkinlik'],
    });
    expect(dist.izleyici).toBe(1);
    expect(dist.katilimci).toBe(0);
  });

  it('total tracked users equals number of users with any action', () => {
    const userActions = {
      'u1': ['v-etkinlikler'],
      'u2': ['p-mentor', 'p-etkinlik', 'p-anket'],
      'u3': ['d-proje'],
    };
    expect(Object.keys(userActions).length).toBe(3);
    const dist = buildDistribution(userActions);
    expect(dist.izleyici + dist.katilimci + dist.katki_sunan + dist.etki_yaratan).toBe(3);
  });
});

// ── topActions ranking ────────────────────────────────────────────────────────

describe('topActions popularity ranking', () => {
  function buildTopActions(actionRows: { action_id: string }[]): { actionId: string; count: number }[] {
    const popularity = new Map<string, number>();
    for (const row of actionRows) {
      popularity.set(row.action_id, (popularity.get(row.action_id) ?? 0) + 1);
    }
    return [...popularity.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actionId, count]) => ({ actionId, count }));
  }

  it('ranks actions by frequency descending', () => {
    const rows = [
      { action_id: 'v-etkinlikler' },
      { action_id: 'v-etkinlikler' },
      { action_id: 'v-etkinlikler' },
      { action_id: 'v-mentorluk' },
      { action_id: 'v-mentorluk' },
      { action_id: 'p-mentor' },
    ];
    const top = buildTopActions(rows);
    expect(top[0]).toEqual({ actionId: 'v-etkinlikler', count: 3 });
    expect(top[1]).toEqual({ actionId: 'v-mentorluk', count: 2 });
    expect(top[2]).toEqual({ actionId: 'p-mentor', count: 1 });
  });

  it('returns at most 10 entries', () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ action_id: `v-action-${i}` }));
    const top = buildTopActions(rows);
    expect(top.length).toBeLessThanOrEqual(10);
  });

  it('returns empty array when no actions', () => {
    expect(buildTopActions([])).toEqual([]);
  });
});
