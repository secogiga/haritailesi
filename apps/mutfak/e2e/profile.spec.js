"use strict";
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
test_1.test.describe('Profil — Hesabım', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.dismissBanner)(page)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/hesabim')];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('profil sayfası yüklenir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('profil sekmesi gösterilir (Profil / Kaydedilenler)', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var tabs;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tabs = page.locator('button[role="tab"], button').filter({ hasText: /profil|kaydedil/i });
                    return [4 /*yield*/, (0, test_1.expect)(tabs.first()).toBeVisible({ timeout: 5000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('profil formu alanları mevcut', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var displayNameInput;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    displayNameInput = page.locator('input[placeholder*="adın"], input[name="displayName"], input').first();
                    return [4 /*yield*/, (0, test_1.expect)(displayNameInput).toBeVisible({ timeout: 5000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Ayarlar', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.dismissBanner)(page)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/ayarlar')];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('ayarlar sayfası yüklenir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('şifre değiştirme formu mevcut', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var passwordSection;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    passwordSection = page.locator('text=/şifre/i').first();
                    return [4 /*yield*/, (0, test_1.expect)(passwordSection).toBeVisible({ timeout: 5000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('dark mode toggle çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var toggle, beforeTheme, afterTheme;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    toggle = page.locator('[role="switch"], button').filter({ hasText: /karanlık|tema|dark/i }).first();
                    return [4 /*yield*/, toggle.isVisible({ timeout: 2000 }).catch(function () { return false; })];
                case 1:
                    if (!_c.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, page.evaluate(function () { return document.documentElement.getAttribute('data-theme'); })];
                case 2:
                    beforeTheme = _c.sent();
                    return [4 /*yield*/, toggle.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.evaluate(function () { return document.documentElement.getAttribute('data-theme'); })];
                case 4:
                    afterTheme = _c.sent();
                    (0, test_1.expect)(beforeTheme).not.toBe(afterTheme);
                    // Reset
                    return [4 /*yield*/, toggle.click()];
                case 5:
                    // Reset
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Mesajlar', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.dismissBanner)(page)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.goto('/mesajlar')];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('mesajlar sayfası yüklenir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/mesajlar/)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('h1, h2, text=/mesaj/i').first()).toBeVisible({ timeout: 8000 })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Bildirimler', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.dismissBanner)(page)];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('bildirim bell açılır ve kapanır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var bell;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/akis')];
                case 1:
                    _c.sent();
                    bell = page.locator('button[aria-label*="bildirim"], button[aria-label*="Bildirim"]').first();
                    return [4 /*yield*/, bell.isVisible({ timeout: 2000 }).catch(function () { return false; })];
                case 2:
                    if (!_c.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, bell.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('[class*="notification"], text=/bildirim/i').first()).toBeVisible({ timeout: 3000 })];
                case 4:
                    _c.sent();
                    // Close by clicking elsewhere
                    return [4 /*yield*/, page.keyboard.press('Escape')];
                case 5:
                    // Close by clicking elsewhere
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Accessibility', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, helpers_1.dismissBanner)(page)];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('skip-to-content linki klavye ile erişilebilir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var skipLink;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/akis')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.keyboard.press('Tab')];
                case 2:
                    _c.sent();
                    skipLink = page.locator('a', { hasText: /içeriğe geç/i });
                    return [4 /*yield*/, (0, test_1.expect)(skipLink).toBeFocused({ timeout: 2000 })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('modal açıkken focus trap çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstCard, dialog, focusedElement;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/uyeler')];
                case 1:
                    _c.sent();
                    firstCard = page.locator('[data-card-hover]').first();
                    return [4 /*yield*/, firstCard.isVisible({ timeout: 5000 }).catch(function () { return false; })];
                case 2:
                    if (!_c.sent()) return [3 /*break*/, 9];
                    return [4 /*yield*/, firstCard.click()];
                case 3:
                    _c.sent();
                    dialog = page.locator('[role="dialog"]');
                    return [4 /*yield*/, dialog.isVisible({ timeout: 1000 }).catch(function () { return false; })];
                case 4:
                    if (!_c.sent()) return [3 /*break*/, 9];
                    // Tab multiple times — focus should stay inside the dialog
                    return [4 /*yield*/, page.keyboard.press('Tab')];
                case 5:
                    // Tab multiple times — focus should stay inside the dialog
                    _c.sent();
                    return [4 /*yield*/, page.keyboard.press('Tab')];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, page.evaluate(function () { var _a; return ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.closest('[role="dialog"]')) !== null; })];
                case 7:
                    focusedElement = _c.sent();
                    (0, test_1.expect)(focusedElement).toBeTruthy();
                    return [4 /*yield*/, page.keyboard.press('Escape')];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    }); });
});
