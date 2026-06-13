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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = exports.TEST_USER = void 0;
exports.loginAs = loginAs;
exports.getLevelActions = getLevelActions;
exports.clearLevelActions = clearLevelActions;
exports.TEST_USER = {
    email: (_a = process.env.E2E_USER_EMAIL) !== null && _a !== void 0 ? _a : 'e2e@haritailesi.org',
    password: (_b = process.env.E2E_USER_PASSWORD) !== null && _b !== void 0 ? _b : 'E2eTest1!',
};
exports.API_URL = (_c = process.env.NEXT_PUBLIC_API_URL) !== null && _c !== void 0 ? _c : 'http://localhost:3000';
/**
 * Sahne'de login UI yoktur — API'ye doğrudan POST yaparak cookie alırız.
 * Playwright'ın page.request, browser context ile cookie store'u paylaşır.
 */
function loginAs(page_1) {
    return __awaiter(this, arguments, void 0, function (page, email, password) {
        var res;
        if (email === void 0) { email = exports.TEST_USER.email; }
        if (password === void 0) { password = exports.TEST_USER.password; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.request.post("".concat(exports.API_URL, "/api/v1/auth/login"), {
                        data: { email: email, password: password },
                    })];
                case 1:
                    res = _a.sent();
                    if (!res.ok())
                        throw new Error("Login ba\u015Far\u0131s\u0131z: HTTP ".concat(res.status()));
                    // Cookie set edildi — sayfayı yenile ki SahneAuthContext /users/me isteği atsın
                    return [4 /*yield*/, page.goto('/')];
                case 2:
                    // Cookie set edildi — sayfayı yenile ki SahneAuthContext /users/me isteği atsın
                    _a.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** localStorage'daki level aksiyonlarını döndürür */
function getLevelActions(page) {
    return __awaiter(this, void 0, void 0, function () {
        var raw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.evaluate(function () { return localStorage.getItem('sahne_level_actions'); })];
                case 1:
                    raw = _a.sent();
                    if (!raw)
                        return [2 /*return*/, []];
                    try {
                        return [2 /*return*/, JSON.parse(raw)];
                    }
                    catch (_b) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * localStorage'ı temizler.
 * about:blank sayfasında localStorage erişimi SecurityError verir —
 * önce base URL'e gidilir.
 */
function clearLevelActions(page) {
    return __awaiter(this, void 0, void 0, function () {
        var url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = page.url();
                    if (!(!url || url === 'about:blank')) return [3 /*break*/, 2];
                    return [4 /*yield*/, page.goto('/')];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, page.evaluate(function () {
                        try {
                            localStorage.removeItem('sahne_level_actions');
                        }
                        catch ( /* ignore */_a) { /* ignore */ }
                    })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
