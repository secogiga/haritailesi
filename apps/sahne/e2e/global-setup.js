"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
var bcrypt = __importStar(require("bcryptjs"));
var E2E_EMAIL = "e2e-pw-".concat(Date.now(), "@test.haritailesi.org");
var E2E_PASSWORD = 'E2eTest1!'; // 9 karakter — API min-8 gereksinimi karşılar
function globalSetup(_config) {
    return __awaiter(this, void 0, void 0, function () {
        var dbUrl, postgres_1, sql, passwordHash, rows, userId, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dbUrl = process.env['DATABASE_URL'];
                    if (!dbUrl)
                        return [2 /*return*/]; // DATABASE_URL yok — login testleri atlanacak
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('postgres')); })];
                case 2:
                    postgres_1 = (_b.sent()).default;
                    sql = postgres_1(dbUrl, { max: 1 });
                    return [4 /*yield*/, bcrypt.hash(E2E_PASSWORD, 8)];
                case 3:
                    passwordHash = _b.sent();
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      INSERT INTO users (email, password_hash, membership_tier, status)\n      VALUES (", ", ", ", 'individual_member', 'active')\n      RETURNING id\n    "], ["\n      INSERT INTO users (email, password_hash, membership_tier, status)\n      VALUES (", ", ", ", 'individual_member', 'active')\n      RETURNING id\n    "])), E2E_EMAIL, passwordHash)];
                case 4:
                    rows = _b.sent();
                    userId = (_a = rows[0]) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId)
                        throw new Error('Test kullanıcısı oluşturulamadı');
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      INSERT INTO user_profiles (user_id, display_name)\n      VALUES (", ", 'E2E Playwright')\n    "], ["\n      INSERT INTO user_profiles (user_id, display_name)\n      VALUES (", ", 'E2E Playwright')\n    "])), userId)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, sql.end()];
                case 6:
                    _b.sent();
                    // Bu env var'lar worker process'lere miras geçer (Playwright, setup tamamlandıktan sonra spawn eder)
                    process.env['E2E_USER_EMAIL'] = E2E_EMAIL;
                    process.env['E2E_USER_PASSWORD'] = E2E_PASSWORD;
                    process.env['_E2E_USER_ID'] = userId;
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _b.sent();
                    // Kurulum başarısız olursa login testleri test.skip koşulu ile atlanır
                    console.warn('[e2e/global-setup] Atlandı:', err_1.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
