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
exports.generateMetadata = generateMetadata;
exports.default = BiletPage;
var navigation_1 = require("next/navigation");
var link_1 = __importDefault(require("next/link"));
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var EVENT_TYPE_LABELS = {
    kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
    webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};
function getTicket(code) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/cms/tickets/").concat(code), {
                            next: { revalidate: 60 },
                        })];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [2 /*return*/, res.json()];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var code, ticket;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    code = (_c.sent()).code;
                    return [4 /*yield*/, getTicket(code)];
                case 2:
                    ticket = _c.sent();
                    if (!ticket)
                        return [2 /*return*/, { title: 'Bilet Bulunamadı' }];
                    return [2 /*return*/, { title: "E-Bilet \u2014 ".concat(ticket.eventTitle), robots: 'noindex' }];
            }
        });
    });
}
function BiletPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var code, ticket, shortCode, typeLabel, isPast, formattedDate, formattedEnd;
        var _c, _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    code = (_e.sent()).code;
                    return [4 /*yield*/, getTicket(code)];
                case 2:
                    ticket = _e.sent();
                    if (!ticket)
                        (0, navigation_1.notFound)();
                    shortCode = ticket.ticketCode.split('-')[0].toUpperCase();
                    typeLabel = (_c = EVENT_TYPE_LABELS[ticket.eventType]) !== null && _c !== void 0 ? _c : ticket.eventType;
                    isPast = new Date(ticket.dateStart) < new Date();
                    formattedDate = new Date(ticket.dateStart).toLocaleString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
                    });
                    formattedEnd = ticket.dateEnd
                        ? new Date(ticket.dateEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
                        : null;
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <main className="min-h-screen dark:bg-[#070c1a] flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-md">

          {/* Geçerlilik rozeti */}
          <div className={"flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-full text-sm font-semibold w-fit mx-auto ".concat(isPast ? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
            <span className={"w-2 h-2 rounded-full ".concat(isPast ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse')}/>
            {isPast ? 'Geçmiş Etkinlik' : 'Geçerli Bilet'}
          </div>

          {/* Bilet kartı */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">

            {/* Üst şerit */}
            <div className="bg-gradient-to-r from-[#1e3a56] to-[#26496b] px-6 py-5">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">E-BİLET · Haritailesi</p>
              <h1 className="text-lg font-black text-white leading-snug">{ticket.eventTitle}</h1>
              <span className="mt-2 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90">{typeLabel}</span>
            </div>

            {/* Kesik çizgi */}
            <div className="relative h-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] -translate-x-1/2"/>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] translate-x-1/2"/>
              <div className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-slate-700"/>
            </div>

            {/* İçerik */}
            <div className="px-6 py-5 space-y-4">
              {/* Katılımcı */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                {ticket.avatarUrl ? (<img src={ticket.avatarUrl} alt={ticket.displayName} className="w-10 h-10 rounded-full object-cover"/>) : (<div className="w-10 h-10 rounded-full bg-[#26496b] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(_d = ticket.displayName[0]) === null || _d === void 0 ? void 0 : _d.toUpperCase()}
                  </div>)}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Katılımcı</p>
                  <p className="font-bold text-gray-900 dark:text-slate-100">{ticket.displayName}</p>
                </div>
              </div>

              {/* Detaylar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Tarih</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{formattedDate}{formattedEnd ? " \u2013 ".concat(formattedEnd) : ''}</p>
                </div>
                {ticket.location && (<div>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Konum</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{ticket.location}</p>
                  </div>)}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Bilet Kodu</p>
                  <p className="text-sm font-bold font-mono text-[#26496b] dark:text-blue-400 tracking-wider">{shortCode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Kayıt Tarihi</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{new Date(ticket.joinedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Kesik çizgi alt */}
            <div className="relative h-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] -translate-x-1/2"/>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#070c1a] translate-x-1/2"/>
              <div className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-slate-700"/>
            </div>

            {/* Alt — onay işareti */}
            <div className="px-6 py-5 flex items-center justify-between bg-gray-50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div className={"w-8 h-8 rounded-full flex items-center justify-center ".concat(isPast ? 'bg-gray-200 dark:bg-slate-700' : 'bg-emerald-500')}>
                  <svg className={"w-5 h-5 ".concat(isPast ? 'text-gray-500' : 'text-white')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    {isPast ? 'Etkinlik Tamamlandı' : 'Katılım Onaylandı'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">Haritailesi tarafından doğrulandı</p>
                </div>
              </div>
              <link_1.default href={"/etkinlikler/".concat(ticket.eventSlug)} className="text-xs font-semibold text-[var(--color-mavi)] dark:text-blue-400 hover:underline">
                Etkinlik →
              </link_1.default>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
            Bu bilet kişiye özeldir. Kayıplar için iletisim@haritailesi.org
          </p>
        </div>
      </main>
    </>)];
            }
        });
    });
}
