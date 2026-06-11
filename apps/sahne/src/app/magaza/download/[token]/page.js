"use strict";
'use client';
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DownloadPage;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function DownloadPage() {
    var _this = this;
    var params = (0, navigation_1.useParams)();
    var token = params['token'];
    var _a = (0, react_1.useState)('loading'), status = _a[0], setStatus = _a[1];
    var _b = (0, react_1.useState)(''), errorMsg = _b[0], setErrorMsg = _b[1];
    (0, react_1.useEffect)(function () {
        if (!token) {
            setStatus('error');
            return;
        }
        fetch("".concat(API_URL, "/api/v1/store/download/").concat(token))
            .then(function (res) { return __awaiter(_this, void 0, void 0, function () {
            var body, data;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!res.ok) return [3 /*break*/, 2];
                        return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                    case 1:
                        body = _b.sent();
                        throw new Error((_a = body.message) !== null && _a !== void 0 ? _a : 'İndirme bağlantısı geçersiz veya süresi dolmuş.');
                    case 2: return [4 /*yield*/, res.json()];
                    case 3:
                        data = _b.sent();
                        setStatus('success');
                        window.location.href = data.downloadUrl;
                        return [2 /*return*/];
                }
            });
        }); })
            .catch(function (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
            setStatus('error');
        });
    }, [token]); // eslint-disable-line
    return (<>
      <Navbar_1.default />
      <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
          {status === 'loading' && (<>
              <div className="w-12 h-12 rounded-full border-4 border-[#26496b] border-t-transparent animate-spin mx-auto mb-4"/>
              <p className="text-sm text-gray-500 dark:text-slate-400">İndirme hazırlanıyor…</p>
            </>)}

          {status === 'success' && (<>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">İndirme Başlıyor</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Dosya otomatik olarak indirilecek. Başlamadıysa{' '}
                <a href={"".concat(API_URL, "/api/v1/store/download/").concat(token)} className="text-[#26496b] dark:text-blue-400 hover:underline">
                  buraya tıklayın
                </a>.
              </p>
            </>)}

          {status === 'error' && (<>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">İndirme Başarısız</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{errorMsg || 'Bağlantı geçersiz veya süresi dolmuş.'}</p>
              <a href="/magaza/siparislerim" className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl hover:bg-[var(--color-mavi-acik)] transition-colors">
                Siparişlerimi Gör →
              </a>
            </>)}
        </div>
      </main>
    </>);
}
