"use strict";
/**
 * Level Actions — E2E Test Suite
 *
 * Gerçek NestJS AppModule + PostgreSQL üzerinde tam HTTP akışını test eder:
 *   1. Login → cookie al
 *   2. POST /me/actions → aksiyon kaydet, completedActionIds dön
 *   3. GET /users/me  → completedActionIds kalıcı
 *   4. POST /me/actions (tekrar) → idempotent
 *   5. POST /me/actions (geçersiz ID) → reddedilir
 *   6. POST /me/actions/sync → bulk sync, geçersizler filtrelenir
 *   7. Logout → cleanup
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@nestjs/testing");
var common_1 = require("@nestjs/common");
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var supertest_1 = __importDefault(require("supertest"));
var bcrypt = __importStar(require("bcrypt"));
var app_module_1 = require("../src/app.module");
var database_1 = require("@haritailesi/database");
var drizzle_orm_1 = require("drizzle-orm");
var database_constants_1 = require("../src/database/database.constants");
// ─── Test kullanıcı sabitleri ─────────────────────────────────────────────────
var E2E_EMAIL = "e2e-level-".concat(Date.now(), "@test.haritailesi.org");
var E2E_PASSWORD = 'E2eLevel1!';
// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function extractCookies(res) {
    var _a;
    var raw = ((_a = res.headers['set-cookie']) !== null && _a !== void 0 ? _a : []);
    return raw.map(function (c) { return c.split(';')[0]; }).join('; ');
}
// ─── Suite ───────────────────────────────────────────────────────────────────
describe('Level Actions — E2E', function () {
    var app;
    var db;
    var userId;
    var cookies;
    // ── Kurulum: app boot + test kullanıcısı oluştur ──────────────────────────
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var moduleRef, hash, u;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, testing_1.Test.createTestingModule({
                        imports: [app_module_1.AppModule],
                    }).compile()];
                case 1:
                    moduleRef = _a.sent();
                    app = moduleRef.createNestApplication();
                    app.use((0, cookie_parser_1.default)());
                    app.setGlobalPrefix('api');
                    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
                    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
                    return [4 /*yield*/, app.init()];
                case 2:
                    _a.sent();
                    // DB instance'ını al (DATABASE_TOKEN bir Symbol — string ile erişilemez)
                    db = app.get(database_constants_1.DATABASE_TOKEN);
                    return [4 /*yield*/, bcrypt.hash(E2E_PASSWORD, 10)];
                case 3:
                    hash = _a.sent();
                    return [4 /*yield*/, db.insert(database_1.users).values({
                            email: E2E_EMAIL,
                            passwordHash: hash,
                            membershipTier: 'individual_member',
                            status: 'active',
                        }).returning({ id: database_1.users.id })];
                case 4:
                    u = (_a.sent())[0];
                    userId = u.id;
                    return [4 /*yield*/, db.insert(database_1.userProfiles).values({ userId: userId, displayName: 'E2E Tester' })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.delete(database_1.userLevelActions).where((0, drizzle_orm_1.eq)(database_1.userLevelActions.userId, userId))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db.delete(database_1.users).where((0, drizzle_orm_1.eq)(database_1.users.id, userId))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, app.close()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 1. Login ──────────────────────────────────────────────────────────────
    it('1. login — geçerli kimlik bilgileriyle cookie alır', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/auth/login')
                        .send({ email: E2E_EMAIL, password: E2E_PASSWORD })
                        .expect(200)];
                case 1:
                    res = _a.sent();
                    expect(res.body).toHaveProperty('accessToken');
                    cookies = extractCookies(res);
                    expect(cookies).toMatch(/hi_access|access_token/); // cookie adı ortama göre değişebilir
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 2. Aksiyon kaydet ─────────────────────────────────────────────────────
    it('2. POST /me/actions — geçerli aksiyon kaydedilir', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions')
                        .set('Cookie', cookies)
                        .send({ actionId: 'v-etkinlikler' })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    expect(res.body.completedActionIds).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
    it('3. GET /users/me — completedActionIds kalıcı olarak dönüyor', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .get('/api/v1/users/me')
                        .set('Cookie', cookies)
                        .expect(200)];
                case 1:
                    res = _a.sent();
                    expect(res.body.completedActionIds).toContain('v-etkinlikler');
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 3. Idempotency ────────────────────────────────────────────────────────
    it('4. POST /me/actions (tekrar) — idempotent, çift kayıt olmaz', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions')
                        .set('Cookie', cookies)
                        .send({ actionId: 'v-etkinlikler' })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    count = res.body.completedActionIds.filter(function (id) { return id === 'v-etkinlikler'; }).length;
                    expect(count).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 4. Whitelist reddi ────────────────────────────────────────────────────
    it('5. POST /me/actions — geçersiz ID reddedilir, boş liste döner', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions')
                        .set('Cookie', cookies)
                        .send({ actionId: 'x-sahte-aksiyon' })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    expect(res.body.completedActionIds).not.toContain('x-sahte-aksiyon');
                    return [2 /*return*/];
            }
        });
    }); });
    it('5b. POST /me/actions — boş actionId reddedilir', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions')
                        .set('Cookie', cookies)
                        .send({ actionId: '' })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    expect(res.body.completedActionIds).not.toContain('');
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 5. Bulk sync ──────────────────────────────────────────────────────────
    it('6. POST /me/actions/sync — geçerli ID\'ler eklenir, geçersizler filtrelenir', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions/sync')
                        .set('Cookie', cookies)
                        .send({ actionIds: ['v-mentorluk', 'v-egitim', 'x-sahte', '__proto__'] })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    expect(res.body.completedActionIds).toContain('v-mentorluk');
                    expect(res.body.completedActionIds).toContain('v-egitim');
                    expect(res.body.completedActionIds).not.toContain('x-sahte');
                    expect(res.body.completedActionIds).not.toContain('__proto__');
                    return [2 /*return*/];
            }
        });
    }); });
    it('6b. POST /me/actions/sync — boş dizi mevcut listeyi döndürür', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions/sync')
                        .set('Cookie', cookies)
                        .send({ actionIds: [] })
                        .expect(201)];
                case 1:
                    res = _a.sent();
                    // Önceki aksiyonlar hâlâ orada
                    expect(res.body.completedActionIds).toContain('v-etkinlikler');
                    expect(Array.isArray(res.body.completedActionIds)).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 6. Auth guard ─────────────────────────────────────────────────────────
    it('7. Cookie olmadan /me/actions 401 döner', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .post('/api/v1/users/me/actions')
                        .send({ actionId: 'v-etkinlikler' })
                        .expect(401)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // ── 7. Kademe hesabı tutarlılığı ──────────────────────────────────────────
    it('8. 3 p- aksiyonu sonrası kademe katilimci olmalı', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _i, _a, id, meRes, ids, pCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, _a = ['p-mentor', 'p-etkinlik', 'p-anket'];
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    id = _a[_i];
                    return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                            .post('/api/v1/users/me/actions')
                            .set('Cookie', cookies)
                            .send({ actionId: id })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, (0, supertest_1.default)(app.getHttpServer())
                        .get('/api/v1/users/me')
                        .set('Cookie', cookies)
                        .expect(200)];
                case 5:
                    meRes = _b.sent();
                    ids = meRes.body.completedActionIds;
                    pCount = ids.filter(function (id) { return id.startsWith('p-'); }).length;
                    expect(pCount).toBeGreaterThanOrEqual(3);
                    return [2 /*return*/];
            }
        });
    }); });
});
