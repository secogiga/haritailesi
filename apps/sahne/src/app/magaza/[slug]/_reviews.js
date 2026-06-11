"use strict";
'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ReviewsSection = ReviewsSection;
var react_1 = require("react");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function Stars(_a) {
    var rating = _a.rating;
    return <span className="text-yellow-500 text-sm">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}
function ReviewsSection(_a) {
    var slug = _a.slug, productId = _a.productId;
    var _b = (0, react_1.useState)(null), data = _b[0], setData = _b[1];
    var _c = (0, react_1.useState)(false), showForm = _c[0], setShowForm = _c[1];
    var _d = (0, react_1.useState)({ buyerName: '', buyerEmail: '', rating: 5, comment: '' }), form = _d[0], setForm = _d[1];
    var _e = (0, react_1.useState)(false), submitting = _e[0], setSubmitting = _e[1];
    var _f = (0, react_1.useState)(false), submitted = _f[0], setSubmitted = _f[1];
    (0, react_1.useEffect)(function () {
        fetch("".concat(API_URL, "/api/v1/store/products/").concat(slug, "/reviews"))
            .then(function (r) { return r.json(); })
            .then(function (d) { return setData(d); })
            .catch(function () { });
    }, [slug]);
    var inp = 'w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 dark:bg-slate-900 dark:text-slate-100';
    function submit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setSubmitting(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/reviews"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(__assign(__assign({}, form), { productId: productId })),
                            })];
                    case 2:
                        _b.sent();
                        setSubmitted(true);
                        setShowForm(false);
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        setSubmitting(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Yorumlar</h3>
          {data && data.count > 0 && (<div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(data.avgRating)}/>
              <span className="text-sm text-gray-500 dark:text-slate-400">{data.avgRating.toFixed(1)} — {data.count} yorum</span>
            </div>)}
        </div>
        {!submitted && (<button onClick={function () { return setShowForm(!showForm); }} className="px-4 py-2 text-sm font-semibold text-[#26496b] dark:text-blue-400 border border-[#26496b]/30 dark:border-blue-400/30 rounded-xl hover:bg-[#26496b]/5 transition-colors">
            Yorum Yaz
          </button>)}
      </div>

      {submitted && (<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400 mb-4">
          ✓ Yorumunuz alındı. İnceleme sonrasında yayınlanacak.
        </div>)}

      {showForm && (<form onSubmit={function (e) { return void submit(e); }} className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">Adınız *</label>
              <input required className={inp} value={form.buyerName} onChange={function (e) { return setForm(function (f) { return (__assign(__assign({}, f), { buyerName: e.target.value })); }); }}/></div>
            <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">E-posta *</label>
              <input required type="email" className={inp} value={form.buyerEmail} onChange={function (e) { return setForm(function (f) { return (__assign(__assign({}, f), { buyerEmail: e.target.value })); }); }}/></div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-2">Puanınız</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(function (s) { return (<button key={s} type="button" onClick={function () { return setForm(function (f) { return (__assign(__assign({}, f), { rating: s })); }); }} className={"text-2xl transition-transform hover:scale-110 ".concat(s <= form.rating ? 'text-yellow-500' : 'text-gray-300')}>★</button>); })}
            </div>
          </div>
          <div><label className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 block mb-1">Yorum</label>
            <textarea rows={3} className={inp} value={form.comment} onChange={function (e) { return setForm(function (f) { return (__assign(__assign({}, f), { comment: e.target.value })); }); }} placeholder="Ürün hakkında düşünceleriniz…"/></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={function () { return setShowForm(false); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl">İptal</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-mavi)] rounded-xl disabled:opacity-50">
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>)}

      {!data || data.reviews.length === 0 ? (<p className="text-sm text-gray-400 dark:text-slate-500">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>) : (<div className="space-y-4">
          {data.reviews.map(function (r) { return (<div key={r.id} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={r.rating}/>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.buyerName}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 dark:text-slate-400">{r.comment}</p>}
            </div>); })}
        </div>)}
    </div>);
}
