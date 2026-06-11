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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailClient = DetailClient;
var react_1 = require("react");
var _contact_modal_1 = require("../_contact-modal");
var ShareMenu_1 = require("@/components/ShareMenu");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function DetailClient(_a) {
    var listing = _a.listing, catAccent = _a.catAccent;
    var _b = (0, react_1.useState)(false), contactOpen = _b[0], setContactOpen = _b[1];
    var _c = (0, react_1.useState)(false), reportOpen = _c[0], setReportOpen = _c[1];
    var _d = (0, react_1.useState)(''), reportMsg = _d[0], setReportMsg = _d[1];
    var _e = (0, react_1.useState)(''), reportEmail = _e[0], setReportEmail = _e[1];
    var _f = (0, react_1.useState)('idle'), reportStatus = _f[0], setReportStatus = _f[1];
    function submitReport(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setReportStatus('loading');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/marketplace/content-requests/public"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    displayName: 'Anonim',
                                    email: reportEmail,
                                    source: 'sahne',
                                    type: 'sponsorluk', // closest available; admin sees it as a report
                                    title: "[RAPOR] \u0130lan ID: ".concat(listing.id),
                                    description: "Raporlanan ilan: \"".concat(listing.title, "\"\n\nSebep: ").concat(reportMsg),
                                }),
                            })];
                    case 2:
                        res = _b.sent();
                        setReportStatus(res.ok ? 'done' : 'error');
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        setReportStatus('error');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    return (<>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">İletişim</h2>

        {listing.applyEmail && (<button onClick={function () { return setContactOpen(true); }} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: catAccent }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            İletişime Geç
          </button>)}

        {!listing.applyEmail && listing.applyUrl && (<a href={listing.applyUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: catAccent }}>
            İletişim
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>)}

        {listing.contactPhone && (<a href={"tel:".concat(listing.contactPhone)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 py-2.5 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            {listing.contactPhone}
          </a>)}

        {/* Paylaş */}
        <div className="pt-1">
          <ShareMenu_1.ShareMenu title={listing.title}/>
        </div>
      </div>

      {/* Rapor et */}
      <div className="text-center pt-1">
        <button onClick={function () { return setReportOpen(!reportOpen); }} className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          Bu ilanı raporla
        </button>
      </div>

      {reportOpen && (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
          {reportStatus === 'done' ? (<p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center py-2">
              Raporunuz alındı, teşekkürler.
            </p>) : (<form onSubmit={submitReport} className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">İlanı Raporla</p>
              <input type="email" required value={reportEmail} onChange={function (e) { return setReportEmail(e.target.value); }} placeholder="E-posta adresiniz" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400"/>
              <textarea required rows={2} value={reportMsg} onChange={function (e) { return setReportMsg(e.target.value); }} placeholder="Raporlama sebebini kısaca açıklayın…" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"/>
              {reportStatus === 'error' && <p className="text-xs text-red-500">Hata oluştu.</p>}
              <div className="flex gap-2">
                <button type="button" onClick={function () { return setReportOpen(false); }} className="flex-1 text-xs py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={reportStatus === 'loading'} className="flex-1 text-xs py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                  {reportStatus === 'loading' ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </div>
            </form>)}
        </div>)}

      {contactOpen && (<_contact_modal_1.ContactModal listing={listing} onClose={function () { return setContactOpen(false); }}/>)}
    </>);
}
