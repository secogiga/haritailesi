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
test_1.test.describe('Auth — Giriş / Çıkış', function () {
    (0, test_1.test)('yanlış şifre ile giriş hata gösterir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/giris')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.locator('input[type="email"]').fill(helpers_1.TEST_USER.email)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.locator('input[type="password"]').fill('yanlis_sifre_xyz')];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.locator('button[type="submit"]').click()];
                case 4:
                    _c.sent();
                    // Error message should appear, no redirect
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=/hatalı|başarısız|geçersiz/i').first()).toBeVisible({ timeout: 5000 })];
                case 5:
                    // Error message should appear, no redirect
                    _c.sent();
                    (0, test_1.expect)(page.url()).toContain('/giris');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('geçerli kimlik bilgileri ile akış sayfasına yönlendirir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/akis/)];
                case 2:
                    _c.sent();
                    // Feed should render at least one post or empty state
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('[data-card-hover], text=/Henüz gönderi yok/i').first()).toBeVisible({ timeout: 8000 })];
                case 3:
                    // Feed should render at least one post or empty state
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('şifremi unuttum sayfası e-posta formu gösterir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/sifremi-unuttum')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('input[type="email"]')).toBeVisible()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('button[type="submit"]')).toBeVisible()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('geçersiz e-posta ile şifremi unuttum doğrulama hatası verir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/sifremi-unuttum')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.locator('input[type="email"]').fill('bozuk-email')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, page.locator('button[type="submit"]').click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=/geçerli|e-posta/i').first()).toBeVisible({ timeout: 3000 })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('giriş yapmamış kullanıcı akış sayfasından giriş sayfasına yönlenir', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/akis')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.waitForURL('**/giris', { timeout: 5000 })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
test_1.test.describe('Auth — Mobil', function () {
    test_1.test.use({ viewport: { width: 390, height: 844 } });
    (0, test_1.test)('mobilde giriş formu çalışır', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, helpers_1.loginAs)(page)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/akis/)];
                case 2:
                    _c.sent();
                    // Mobile bottom nav should be visible
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('nav.fixed.bottom-0')).toBeVisible()];
                case 3:
                    // Mobile bottom nav should be visible
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
