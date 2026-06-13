"use strict";
/**
 * Level Actions — Sahne E2E
 *
 * Anonim kullanıcı sayfa ziyareti → localStorage aksiyon birikimi
 * Login sonrası localStorage → sunucu sync
 * MemberCard ve JourneyAssistant görsel doğrulamaları
 *
 * Gereksinim: Sahne dev server + API çalışıyor olmalı
 * Çalıştır: npm run test:e2e (apps/sahne dizininde)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var test_1 = require("@playwright/test");
var helpers_1 = require("./helpers");
// ── 1. Anonim kullanıcı — sayfa ziyareti localStorage'ı günceller ─────────────
test_1.test.describe('Anonim kullanıcı — sayfa ziyareti tracking', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.clearLevelActions)(page)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('etkinlikler sayfasını ziyaret edince v-etkinlikler localStorage\'a yazılır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var actions;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/etkinlikler')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    // PageActionTracker client component'i çalışması için kısa bekleme
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 3:
                    // PageActionTracker client component'i çalışması için kısa bekleme
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 4:
                    actions = _c.sent();
                    (0, test_1.expect)(actions).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('mentorluk sayfasını ziyaret edince v-mentorluk eklenir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var actions;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/mentorluk')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 4:
                    actions = _c.sent();
                    (0, test_1.expect)(actions).toContain('v-mentorluk');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('birden fazla sayfa ziyareti birikiyor', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var actions;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/etkinlikler')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/mentorluk')];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 7:
                    actions = _c.sent();
                    (0, test_1.expect)(actions).toContain('v-etkinlikler');
                    (0, test_1.expect)(actions).toContain('v-mentorluk');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('aynı sayfayı ziyaret edince aksiyon ID tekrarlanmaz', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var actions, count;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/etkinlikler')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/etkinlikler')];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 7:
                    actions = _c.sent();
                    count = actions.filter(function (id) { return id === 'v-etkinlikler'; }).length;
                    (0, test_1.expect)(count).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
});
// ── 2. Login sonrası sync ─────────────────────────────────────────────────────
test_1.test.describe('Login sonrası localStorage → sunucu sync', function () {
    test_1.test.skip(!process.env['E2E_USER_EMAIL'], 'E2E_USER_EMAIL ayarlanmamış — gerçek kullanıcı kimliği gerekli');
    (0, test_1.test)('login sonrası localStorage boşaltılır (sunucuya sync edildi)', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var beforeLogin, afterLogin;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Anonim olarak birkaç sayfa ziyaret et
                return [4 /*yield*/, page.goto('/etkinlikler')];
                case 1:
                    // Anonim olarak birkaç sayfa ziyaret et
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(400)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/mentorluk')];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(400)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 7:
                    beforeLogin = _c.sent();
                    (0, test_1.expect)(beforeLogin.length).toBeGreaterThan(0);
                    // Login yap
                    return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 8:
                    // Login yap
                    _c.sent();
                    // SahneAuthContext login sonrası syncLocalStorageActions çağırır
                    return [4 /*yield*/, page.waitForTimeout(1000)];
                case 9:
                    // SahneAuthContext login sonrası syncLocalStorageActions çağırır
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.getLevelActions)(page)];
                case 10:
                    afterLogin = _c.sent();
                    (0, test_1.expect)(afterLogin.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
});
// ── 3. MemberCard görsel doğrulama ────────────────────────────────────────────
test_1.test.describe('MemberCard — login sonrası gösterim', function () {
    test_1.test.skip(!process.env['E2E_USER_EMAIL'], 'E2E_USER_EMAIL ayarlanmamış — gerçek kullanıcı kimliği gerekli');
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('MemberCard sayfada görünür', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var card;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    // SahneAuthContext /users/me isteği tamamlanana kadar bekle
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 3:
                    // SahneAuthContext /users/me isteği tamamlanana kadar bekle
                    _c.sent();
                    card = page.locator('[class*="shadow-2xl"][class*="select-none"]').first();
                    return [4 /*yield*/, (0, test_1.expect)(card).toBeVisible({ timeout: 8000 })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('kademe etiketi görünür (1.-4. Kademe)', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var kademeTxt;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 3:
                    _c.sent();
                    kademeTxt = page.locator('[class*="shadow-2xl"]').filter({ hasText: /\d\. Kademe/ }).first();
                    return [4 /*yield*/, (0, test_1.expect)(kademeTxt).toBeVisible({ timeout: 8000 })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
// ── 4. JourneyAssistant — Git → tıklaması tracking ───────────────────────────
test_1.test.describe('JourneyAssistant — Git → link tracking', function () {
    (0, test_1.test)('JourneyAssistant tetiklendiğinde açılır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var trigger, card;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/')];
                case 1:
                    _c.sent();
                    trigger = page.locator('[aria-label*="Rehber"], button:has-text("Rehber"), button:has-text("Yolculuk")').first();
                    return [4 /*yield*/, trigger.isVisible({ timeout: 2000 }).catch(function () { return false; })];
                case 2:
                    if (!_c.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, trigger.click()];
                case 3:
                    _c.sent();
                    card = page.locator('[data-action-id], [class*="action"]').first();
                    return [4 /*yield*/, (0, test_1.expect)(card).toBeVisible({ timeout: 3000 })];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    test_1.test.skip(); // JourneyAssistant bu sayfada yoksa test atlanır
                    _c.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
});
