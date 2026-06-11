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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadata = generateMetadata;
exports.default = IlanDetailPage;
var navigation_1 = require("next/navigation");
var link_1 = __importDefault(require("next/link"));
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var api_1 = require("@/lib/api");
var _detail_client_1 = require("./_detail-client");
var CAT = {
    isbirligi: { label: 'İşbirliği', accent: '#10b981' },
    proje: { label: 'Projeler', accent: '#3b82f6' },
    teknik_destek: { label: 'Teknik Destek', accent: '#06b6d4' },
    freelancer: { label: 'Freelancer', accent: '#8b5cf6' },
    teknoloji_ekipman: { label: 'Teknoloji & Ekipman', accent: '#f59e0b' },
    ikinci_el: { label: 'İkinci El & Satış', accent: '#f97316' },
    mesleki_arac: { label: 'Mesleki Araçlar', accent: '#14b8a6' },
    firsat: { label: 'Fırsatlar', accent: '#f43f5e' },
    duyuru: { label: 'Duyurular', accent: '#6366f1' },
};
function getCat(type) {
    var _a;
    return (_a = CAT[type]) !== null && _a !== void 0 ? _a : { label: type, accent: '#64748b' };
}
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var id, listing;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    id = (_c.sent()).id;
                    return [4 /*yield*/, api_1.cms.jobListingById(id)];
                case 2:
                    listing = _c.sent();
                    if (!listing)
                        return [2 /*return*/, { title: 'İlan Bulunamadı — Haritailesi' }];
                    return [2 /*return*/, {
                            title: "".concat(listing.title, " \u2014 Haritailesi \u0130lan Panosu"),
                            description: listing.description.slice(0, 160),
                        }];
            }
        });
    });
}
function IlanDetailPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var id, listing, cat, publishedDate, expiresDate, daysLeft, isUrgent;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    id = (_c.sent()).id;
                    return [4 /*yield*/, api_1.cms.jobListingById(id)];
                case 2:
                    listing = _c.sent();
                    if (!listing)
                        (0, navigation_1.notFound)();
                    cat = getCat(listing.type);
                    publishedDate = listing.publishedAt
                        ? new Date(listing.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : null;
                    expiresDate = listing.expiresAt
                        ? new Date(listing.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : null;
                    daysLeft = listing.expiresAt
                        ? Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000)
                        : null;
                    isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <main className="min-h-screen bg-[#f4f6f9] dark:bg-[#070c1a]">

        {/* Mini hero */}
        <div className="bg-[#0d1b2a] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, ".concat(cat.accent, "20 0%, transparent 60%)") }}/>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <link_1.default href="/ilanlar" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              İlan Panosu
            </link_1.default>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: cat.accent }}>
                {cat.label}
              </span>
              {isUrgent && (<span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block"/>
                  {daysLeft === 0 ? 'Bugün bitiyor' : "".concat(daysLeft, " g\u00FCn kald\u0131")}
                </span>)}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{listing.company}</span>
              {listing.location && (<span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {listing.location}
                </span>)}
              {publishedDate && <span>{publishedDate}</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sol — açıklama */}
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8 mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">Açıklama</h2>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {listing.tags && listing.tags.length > 0 && (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">Etiketler</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(function (t) { return (<span key={t} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1 rounded-lg font-medium">
                        {t}
                      </span>); })}
                  </div>
                </div>)}
            </div>

            {/* Sağ — bilgi + aksiyonlar */}
            <div className="lg:w-72 shrink-0 space-y-4">

              {/* Aksiyonlar */}
              <_detail_client_1.DetailClient listing={listing} catAccent={cat.accent}/>

              {/* Detaylar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">Detaylar</h2>
                <dl className="space-y-3">
                  {[
                                { label: 'Kategori', value: cat.label },
                                listing.price && { label: 'Fiyat / Bütçe', value: listing.price },
                                listing.location && { label: 'Konum', value: listing.location },
                                publishedDate && { label: 'Yayın Tarihi', value: publishedDate },
                                expiresDate && { label: 'Son Tarih', value: expiresDate },
                            ].filter(Boolean).map(function (item) {
                                var row = item;
                                return (<div key={row.label} className="flex items-start justify-between gap-3">
                        <dt className="text-xs text-gray-400 dark:text-slate-500 font-medium shrink-0">{row.label}</dt>
                        <dd className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-right">{row.value}</dd>
                      </div>);
                            })}
                </dl>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>)];
            }
        });
    });
}
