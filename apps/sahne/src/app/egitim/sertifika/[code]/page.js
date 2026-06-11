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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = CertificatePage;
var link_1 = __importDefault(require("next/link"));
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var _CertActions_1 = require("./_CertActions");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
exports.metadata = { title: 'Sertifika Doğrulama' };
function CertificatePage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var code, cert, res, _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    code = (_d.sent()).code;
                    cert = null;
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/cms/certificates/verify/").concat(code), { cache: 'no-store' })];
                case 3:
                    res = _d.sent();
                    if (!res.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.json()];
                case 4:
                    cert = (_d.sent());
                    _d.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _c = _d.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, (<>
      <Navbar_1.default />
      <style>{"@media print { header, nav { display: none !important; } body { background: white !important; } .print\\:hidden { display: none !important; } }"}</style>
      <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center px-4 py-16 print:py-4 print:min-h-0">
        {cert ? (<div className="w-full max-w-2xl">
            {/* Sertifika kartı */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[var(--color-mavi)]/20 shadow-xl overflow-hidden">
              {/* Başlık */}
              <div className="bg-gradient-to-br from-[#1a3350] to-[#26496b] px-8 py-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <circle cx="170" cy="10" r="80" fill="white"/><circle cx="20" cy="90" r="50" fill="white"/>
                  </svg>
                </div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Haritailesi</p>
                <h1 className="text-2xl font-black mb-1">Başarı Sertifikası</h1>
                <p className="text-white/70 text-sm">Bu sertifika resmi olarak doğrulanmıştır ✓</p>
              </div>

              {/* İçerik */}
              <div className="px-8 py-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--color-mavi)]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏆</span>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-1">{cert.holderName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">aşağıdaki kursu başarıyla tamamlamıştır:</p>

                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-6 py-4 mb-6">
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{cert.trainingTitle}</p>
                  {cert.quizScore !== null && (<p className="text-sm text-emerald-600 font-medium mt-1">Quiz Puanı: %{cert.quizScore}</p>)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Verilme Tarihi</p>
                    <p className="font-semibold text-gray-800 dark:text-slate-200">
                      {new Date(cert.issuedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Sertifika Kodu</p>
                    <p className="font-mono font-bold text-[var(--color-mavi)] text-sm">{cert.certificateCode}</p>
                  </div>
                </div>

                <_CertActions_1.CertActions code={cert.certificateCode} trainingTitle={cert.trainingTitle}/>

                <div className="flex gap-3 justify-center mt-3 print:hidden">
                  <link_1.default href={"/egitim/".concat(cert.trainingSlug)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    Kursu Gör
                  </link_1.default>
                  <link_1.default href="/egitim" className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                    Tüm Eğitimler
                  </link_1.default>
                </div>
              </div>
            </div>
          </div>) : (<div className="text-center">
            <p className="text-5xl mb-4">❌</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Sertifika Bulunamadı</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Bu kod geçersiz veya sertifika mevcut değil.</p>
            <link_1.default href="/egitim" className="text-sm text-[var(--color-mavi)] hover:underline">← Eğitimlere Dön</link_1.default>
          </div>)}
      </main>
    </>)];
            }
        });
    });
}
