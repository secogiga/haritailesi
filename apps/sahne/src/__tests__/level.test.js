"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var level_1 = require("@/lib/level");
// ── calculateLevel ────────────────────────────────────────────────────────────
(0, vitest_1.describe)('calculateLevel', function () {
    (0, vitest_1.it)('hiç aksiyon yoksa izleyici döner', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)([])).toBe('izleyici');
    });
    (0, vitest_1.it)('sadece v- aksiyonlarıyla izleyici döner', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['v-etkinlikler', 'v-mentorluk', 'v-egitim'])).toBe('izleyici');
    });
    (0, vitest_1.it)('3+ p- aksiyonuyla katilimci döner', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['p-mentor', 'p-etkinlik', 'p-anket'])).toBe('katilimci');
    });
    (0, vitest_1.it)('2 p- aksiyonu eşik altında — izleyici kalır', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['p-mentor', 'p-etkinlik'])).toBe('izleyici');
    });
    (0, vitest_1.it)('2+ c- aksiyonuyla katki_sunan döner', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['c-gonderi', 'c-gorus'])).toBe('katki_sunan');
    });
    (0, vitest_1.it)('1 c- aksiyonu eşik altında', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['c-gonderi'])).toBe('izleyici');
    });
    (0, vitest_1.it)('1 d- aksiyonuyla etki_yaratan döner', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['d-mentor-seans'])).toBe('etki_yaratan');
    });
    (0, vitest_1.it)('etki_yaratan en yüksek öncelik — diğer prefixler varken bile', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['d-proje', 'c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
            .toBe('etki_yaratan');
    });
    (0, vitest_1.it)('katki_sunan, katilimci\'dan önce gelir', function () {
        (0, vitest_1.expect)((0, level_1.calculateLevel)(['c-gonderi', 'c-gorus', 'p-mentor', 'p-etkinlik', 'p-anket']))
            .toBe('katki_sunan');
    });
    (0, vitest_1.it)('API\'deki kanonik mantıkla birebir senkron (referans vektör)', function () {
        // Bu test kasıtlı olarak API level.utils.ts ile aynı sonucu vermeli
        var cases = [
            [[], 'izleyici'],
            [['v-etkinlikler', 'v-mentorluk', 'v-egitim', 'v-hgenc'], 'izleyici'],
            [['p-mentor', 'p-etkinlik', 'p-anket'], 'katilimci'],
            [['c-gonderi', 'c-gorus'], 'katki_sunan'],
            [['d-mentor-seans'], 'etki_yaratan'],
        ];
        for (var _i = 0, cases_1 = cases; _i < cases_1.length; _i++) {
            var _a = cases_1[_i], ids = _a[0], expected = _a[1];
            (0, vitest_1.expect)((0, level_1.calculateLevel)(ids)).toBe(expected);
        }
    });
});
// ── levelProgress ─────────────────────────────────────────────────────────────
(0, vitest_1.describe)('levelProgress', function () {
    (0, vitest_1.it)('izleyici için v- aksiyonlarını sayar, min=4', function () {
        var result = (0, level_1.levelProgress)(['v-etkinlikler', 'v-mentorluk'], 'izleyici');
        (0, vitest_1.expect)(result.done).toBe(2);
        (0, vitest_1.expect)(result.total).toBe(4);
        (0, vitest_1.expect)(result.pct).toBe(50);
    });
    (0, vitest_1.it)('katilimci için p- aksiyonlarını sayar, min=3', function () {
        var result = (0, level_1.levelProgress)(['p-mentor', 'p-etkinlik', 'p-anket'], 'katilimci');
        (0, vitest_1.expect)(result.done).toBe(3);
        (0, vitest_1.expect)(result.total).toBe(3);
        (0, vitest_1.expect)(result.pct).toBe(100);
    });
    (0, vitest_1.it)('katki_sunan için c- aksiyonlarını sayar, min=2', function () {
        var result = (0, level_1.levelProgress)(['c-gonderi'], 'katki_sunan');
        (0, vitest_1.expect)(result.done).toBe(1);
        (0, vitest_1.expect)(result.total).toBe(2);
        (0, vitest_1.expect)(result.pct).toBe(50);
    });
    (0, vitest_1.it)('etki_yaratan için d- aksiyonlarını sayar, min=1', function () {
        var result = (0, level_1.levelProgress)(['d-proje'], 'etki_yaratan');
        (0, vitest_1.expect)(result.done).toBe(1);
        (0, vitest_1.expect)(result.total).toBe(1);
        (0, vitest_1.expect)(result.pct).toBe(100);
    });
    (0, vitest_1.it)('pct 100\'ü aşmaz', function () {
        var result = (0, level_1.levelProgress)(['p-mentor', 'p-etkinlik', 'p-anket', 'p-mentor', 'p-bagis'], 'katilimci');
        (0, vitest_1.expect)(result.pct).toBe(100);
    });
    (0, vitest_1.it)('yanlış prefix aksiyonları saymaz', function () {
        var result = (0, level_1.levelProgress)(['v-etkinlikler', 'v-mentorluk', 'v-egitim'], 'katilimci');
        (0, vitest_1.expect)(result.done).toBe(0);
        (0, vitest_1.expect)(result.pct).toBe(0);
    });
});
// ── LEVEL_META ve LEVEL_ORDER tutarlılığı ────────────────────────────────────
(0, vitest_1.describe)('LEVEL_META ve LEVEL_ORDER', function () {
    (0, vitest_1.it)('LEVEL_ORDER 4 kademe içerir, artan sırada', function () {
        (0, vitest_1.expect)(level_1.LEVEL_ORDER).toEqual(['izleyici', 'katilimci', 'katki_sunan', 'etki_yaratan']);
    });
    (0, vitest_1.it)('her kademedeki no değeri sırasıyla 1-2-3-4', function () {
        level_1.LEVEL_ORDER.forEach(function (id, i) {
            (0, vitest_1.expect)(level_1.LEVEL_META[id].no).toBe(i + 1);
        });
    });
    (0, vitest_1.it)('min eşikleri doğru: 4/3/2/1', function () {
        (0, vitest_1.expect)(level_1.LEVEL_META.izleyici.min).toBe(4);
        (0, vitest_1.expect)(level_1.LEVEL_META.katilimci.min).toBe(3);
        (0, vitest_1.expect)(level_1.LEVEL_META.katki_sunan.min).toBe(2);
        (0, vitest_1.expect)(level_1.LEVEL_META.etki_yaratan.min).toBe(1);
    });
    (0, vitest_1.it)('prefix\'ler doğru atanmış', function () {
        (0, vitest_1.expect)(level_1.LEVEL_META.izleyici.prefix).toBe('v-');
        (0, vitest_1.expect)(level_1.LEVEL_META.katilimci.prefix).toBe('p-');
        (0, vitest_1.expect)(level_1.LEVEL_META.katki_sunan.prefix).toBe('c-');
        (0, vitest_1.expect)(level_1.LEVEL_META.etki_yaratan.prefix).toBe('d-');
    });
});
