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
var vitest_1 = require("vitest");
var react_1 = require("@testing-library/react");
// fetch mock
var mockFetch = vitest_1.vi.fn();
global.fetch = mockFetch;
// localStorage mock
var localStorageMock = (function () {
    var store = {};
    return {
        getItem: function (key) { var _a; return (_a = store[key]) !== null && _a !== void 0 ? _a : null; },
        setItem: function (key, value) { store[key] = value; },
        removeItem: function (key) { delete store[key]; },
        clear: function () { store = {}; },
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
var SahneAuthContext_1 = require("@/contexts/SahneAuthContext");
var rehber_1 = require("@/lib/rehber");
function wrapper(_a) {
    var children = _a.children;
    return <SahneAuthContext_1.SahneAuthProvider>{children}</SahneAuthContext_1.SahneAuthProvider>;
}
(0, vitest_1.beforeEach)(function () {
    vitest_1.vi.clearAllMocks();
    localStorageMock.clear();
});
// Başarılı /users/me yanıtı oluştur
function mockMeResponse(completedActionIds) {
    var _this = this;
    if (completedActionIds === void 0) { completedActionIds = []; }
    return {
        ok: true,
        status: 200,
        json: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
                        id: 'user-1',
                        email: 'test@example.com',
                        membershipTier: 'individual_member',
                        completedActionIds: completedActionIds,
                        profile: { displayName: 'Test User', avatarUrl: null, city: null, profession: null },
                    })];
            });
        }); },
    };
}
(0, vitest_1.describe)('SahneAuthContext — recordAction', function () {
    (0, vitest_1.it)('kullanıcı yokken localStorage\'a yazar', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, stored;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // /users/me 401 döner → kullanıcı yok
                    mockFetch.mockResolvedValue({ ok: false, status: 401, json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({})];
                        }); }); } });
                    result = (0, react_1.renderHook)(function () { return (0, SahneAuthContext_1.useSahneAuth)(); }, { wrapper: wrapper }).result;
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return (0, vitest_1.expect)(result.current.isLoading).toBe(false); })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, result.current.recordAction('v-etkinlikler')];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _b.sent();
                    stored = JSON.parse((_a = localStorageMock.getItem(rehber_1.LS_LEVEL_ACTIONS)) !== null && _a !== void 0 ? _a : '[]');
                    (0, vitest_1.expect)(stored).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('localStorage\'a aynı ID\'yi iki kez yazmaz', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, stored;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockFetch.mockResolvedValue({ ok: false, status: 401, json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({})];
                        }); }); } });
                    result = (0, react_1.renderHook)(function () { return (0, SahneAuthContext_1.useSahneAuth)(); }, { wrapper: wrapper }).result;
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return (0, vitest_1.expect)(result.current.isLoading).toBe(false); })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, result.current.recordAction('v-etkinlikler')];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, result.current.recordAction('v-etkinlikler')];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _b.sent();
                    stored = JSON.parse((_a = localStorageMock.getItem(rehber_1.LS_LEVEL_ACTIONS)) !== null && _a !== void 0 ? _a : '[]');
                    (0, vitest_1.expect)(stored.filter(function (id) { return id === 'v-etkinlikler'; }).length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('kullanıcı varken optimistic update yapar', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Sıra: (1) /users/me → user dön, (2) localStorage boş → sync atla,
                    //        (3) recordAction → /me/actions POST
                    mockFetch
                        .mockResolvedValueOnce(mockMeResponse([])) // (1) /users/me
                        .mockResolvedValueOnce({
                        ok: true,
                        status: 201,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ completedActionIds: ['v-etkinlikler'] })];
                        }); }); },
                    });
                    result = (0, react_1.renderHook)(function () { return (0, SahneAuthContext_1.useSahneAuth)(); }, { wrapper: wrapper }).result;
                    // Kullanıcı yüklenene kadar bekle
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return (0, vitest_1.expect)(result.current.isLoading).toBe(false); })];
                case 1:
                    // Kullanıcı yüklenene kadar bekle
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return (0, vitest_1.expect)(result.current.user).not.toBeNull(); })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, result.current.recordAction('v-etkinlikler')];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _b.sent();
                    // Optimistic update veya server response sonrası completedActionIds'de olmalı
                    (0, vitest_1.expect)((_a = result.current.user) === null || _a === void 0 ? void 0 : _a.completedActionIds).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('login sonrası localStorage aksiyonları sunucuyla sync edilir', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    localStorageMock.setItem(rehber_1.LS_LEVEL_ACTIONS, JSON.stringify(['v-etkinlikler', 'v-mentorluk']));
                    // Sıra: (1) /users/me → user dön, (2) /me/actions/sync → merge edilmiş list dön
                    mockFetch
                        .mockResolvedValueOnce(mockMeResponse([])) // (1) /users/me
                        .mockResolvedValueOnce({
                        ok: true,
                        status: 201,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ completedActionIds: ['v-etkinlikler', 'v-mentorluk'] })];
                        }); }); },
                    });
                    result = (0, react_1.renderHook)(function () { return (0, SahneAuthContext_1.useSahneAuth)(); }, { wrapper: wrapper }).result;
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return (0, vitest_1.expect)(result.current.isLoading).toBe(false); })];
                case 1:
                    _b.sent();
                    // Sync tamamlanana kadar bekle: localStorage temizlenmeli
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            (0, vitest_1.expect)(localStorageMock.getItem(rehber_1.LS_LEVEL_ACTIONS)).toBeNull();
                        }, { timeout: 3000 })];
                case 2:
                    // Sync tamamlanana kadar bekle: localStorage temizlenmeli
                    _b.sent();
                    // Sync sonrası user state'inde completedActionIds güncellenmiş olmalı
                    (0, vitest_1.expect)((_a = result.current.user) === null || _a === void 0 ? void 0 : _a.completedActionIds).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
});
