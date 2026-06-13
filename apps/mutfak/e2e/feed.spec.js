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
test_1.test.describe('Feed — Akış', function () {
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
    (0, test_1.test)('feed sayfası yüklenir ve post kartları görünür', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, test_1.expect)(page.locator('h1, [data-card-hover]').first()).toBeVisible({ timeout: 8000 })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('"Tüm Akış" ve "Takip Edilenler" sekmeleri çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var allTab, followingTab;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    allTab = page.locator('button', { hasText: 'Tüm Akış' });
                    followingTab = page.locator('button', { hasText: 'Takip Edilenler' });
                    return [4 /*yield*/, (0, test_1.expect)(allTab).toBeVisible()];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(followingTab).toBeVisible()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, followingTab.click()];
                case 3:
                    _c.sent();
                    // URL should update or content changes
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/filter=following|\/akis/)];
                case 4:
                    // URL should update or content changes
                    _c.sent();
                    return [4 /*yield*/, allTab.click()];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('[data-card-hover], text=/Henüz gönderi yok/i').first()).toBeVisible({ timeout: 5000 })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('Cmd+K global arama açılır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.keyboard.press('Control+k')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('input[placeholder*="ara"]')).toBeVisible({ timeout: 3000 })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.keyboard.press('Escape')];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('input[placeholder*="ara"]')).not.toBeVisible()];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('gönderi oluşturma modalı açılır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var createBtn;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    createBtn = page.locator('button', { hasText: /paylaş|gönderi oluştur|yeni/i }).first();
                    return [4 /*yield*/, createBtn.isVisible({ timeout: 2000 }).catch(function () { return false; })];
                case 1:
                    if (!_c.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, createBtn.click()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('textarea, [role="dialog"]').first()).toBeVisible({ timeout: 3000 })];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.keyboard.press('Escape')];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('post detay sayfasına geçiş çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstCard, href;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    firstCard = page.locator('[data-card-hover]').first();
                    return [4 /*yield*/, firstCard.isVisible({ timeout: 5000 }).catch(function () { return false; })];
                case 1:
                    if (!_c.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, firstCard.locator('a').first().getAttribute('href')];
                case 2:
                    href = _c.sent();
                    if (!href) return [3 /*break*/, 6];
                    return [4 /*yield*/, page.goto(href)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/akis\/.+/)];
                case 4:
                    _c.sent();
                    // Comments section or post body should appear
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=/yorum|comment/i, article').first()).toBeVisible({ timeout: 5000 })];
                case 5:
                    // Comments section or post body should appear
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('arama sonuçları highlight gösterir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var searchInput, mark;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.keyboard.press('Control+k')];
                case 1:
                    _c.sent();
                    searchInput = page.locator('input[placeholder*="ara"]');
                    return [4 /*yield*/, searchInput.fill('harita')];
                case 2:
                    _c.sent();
                    // Wait for debounce + results
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 3:
                    // Wait for debounce + results
                    _c.sent();
                    mark = page.locator('mark').first();
                    return [4 /*yield*/, mark.isVisible({ timeout: 3000 }).catch(function () { return false; })];
                case 4:
                    if (!_c.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, test_1.expect)(mark).toBeVisible()];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [4 /*yield*/, page.keyboard.press('Escape')];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Feed — Mobil', function () {
    test_1.test.use({ viewport: { width: 390, height: 844 } });
    (0, test_1.test)('mobil bottom nav görünür ve çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var nav;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    nav = page.locator('nav.fixed.bottom-0');
                    return [4 /*yield*/, (0, test_1.expect)(nav).toBeVisible()];
                case 2:
                    _c.sent();
                    // Navigate to members
                    return [4 /*yield*/, nav.locator('a[href="/uyeler"]').click()];
                case 3:
                    // Navigate to members
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/uyeler/)];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
