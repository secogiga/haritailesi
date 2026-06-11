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
exports.default = TercihlerPage;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var API = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var INTEREST_AREAS = [
    { id: 'haberler', label: 'Vakıf Haberleri' },
    { id: 'etkinlikler', label: 'Etkinlikler & Sempozyumlar' },
    { id: 'egitimler', label: 'Eğitimler & Kurslar' },
    { id: 'yayinlar', label: 'Yayınlar & Araştırmalar' },
    { id: 'yarismalar', label: 'Yarışmalar & Ödüller' },
    { id: 'is-ilanlari', label: 'İş & Staj İlanları' },
    { id: 'projeler', label: 'Topluluk Projeleri' },
    { id: 'mentorluk', label: 'Mentorluk Programları' },
];
var REGIONS = [
    'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Erzurum',
    'Eskişehir', 'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Konya',
    'Mersin', 'Samsun', 'Trabzon', 'Yurt Dışı', 'Diğer',
];
function TercihlerPage() {
    var params = (0, navigation_1.useParams)();
    var token = params['token'];
    var _a = (0, react_1.useState)('loading'), status = _a[0], setStatus = _a[1];
    var _b = (0, react_1.useState)(null), profile = _b[0], setProfile = _b[1];
    var _c = (0, react_1.useState)(new Set()), interests = _c[0], setInterests = _c[1];
    var _d = (0, react_1.useState)(''), region = _d[0], setRegion = _d[1];
    var _e = (0, react_1.useState)(false), unsubscribed = _e[0], setUnsubscribed = _e[1];
    var _f = (0, react_1.useState)(''), errorMsg = _f[0], setErrorMsg = _f[1];
    (0, react_1.useEffect)(function () {
        if (!token)
            return;
        fetch("".concat(API, "/api/v1/admin/newsletter/preferences/").concat(token))
            .then(function (r) {
            if (r.status === 404) {
                setStatus('not_found');
                return null;
            }
            if (!r.ok)
                throw new Error('Sunucu hatası');
            return r.json();
        })
            .then(function (data) {
            var _a;
            if (!data)
                return;
            setProfile(data);
            setInterests(new Set(data.interestAreas));
            setRegion((_a = data.region) !== null && _a !== void 0 ? _a : '');
            setUnsubscribed(data.isUnsubscribed);
            setStatus(data.isUnsubscribed ? 'unsubscribed' : 'ready');
        })
            .catch(function (e) { setErrorMsg(e.message); setStatus('error'); });
    }, [token]);
    function toggleInterest(id) {
        setInterests(function (prev) {
            var next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function save() {
        return __awaiter(this, void 0, void 0, function () {
            var r, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setStatus('saving');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(API, "/api/v1/admin/newsletter/preferences/").concat(token), {
                                method: 'PUT',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    email: profile === null || profile === void 0 ? void 0 : profile.email,
                                    interestAreas: Array.from(interests),
                                    region: region || null,
                                    isUnsubscribed: unsubscribed,
                                }),
                            })];
                    case 2:
                        r = _a.sent();
                        if (!r.ok)
                            throw new Error('Kaydedilemedi');
                        setStatus(unsubscribed ? 'unsubscribed' : 'saved');
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        setErrorMsg(e_1.message);
                        setStatus('error');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function resubscribe() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setUnsubscribed(false);
                        setStatus('saving');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(API, "/api/v1/admin/newsletter/preferences/").concat(token), {
                                method: 'PUT',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({ email: profile === null || profile === void 0 ? void 0 : profile.email, isUnsubscribed: false }),
                            })];
                    case 2:
                        _b.sent();
                        setStatus('ready');
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        setStatus('error');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    if (status === 'loading') {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#26496b] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">Tercihleriniz yükleniyor…</p>
        </div>
      </div>);
    }
    if (status === 'not_found') {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Bağlantı Geçersiz</h1>
          <p className="text-gray-500 text-sm">Bu tercih bağlantısı bulunamadı ya da süresi dolmuş olabilir. Lütfen e-postanızdaki en güncel bağlantıyı kullanın.</p>
        </div>
      </div>);
    }
    if (status === 'error') {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Oluştu</h1>
          <p className="text-gray-500 text-sm">{errorMsg || 'Lütfen daha sonra tekrar deneyin.'}</p>
        </div>
      </div>);
    }
    if (status === 'unsubscribed') {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Aboneliğiniz İptal Edildi</h1>
          <p className="text-gray-500 text-sm mb-6">
            {profile === null || profile === void 0 ? void 0 : profile.email} adresine artık bülten göndermeyeceğiz. Tekrar abone olmak ister misiniz?
          </p>
          <button onClick={resubscribe} className="bg-[#26496b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1d374f] transition-colors">
            Yeniden Abone Ol
          </button>
        </div>
      </div>);
    }
    if (status === 'saved') {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Tercihleriniz Kaydedildi</h1>
          <p className="text-gray-500 text-sm">Bundan sonra size yalnızca ilgilendiğiniz içerikleri göndereceğiz.</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src="/2.svg" alt="Haritailesi" className="h-8 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900">E-posta Tercihleriniz</h1>
          <p className="text-gray-500 text-sm mt-1">{profile === null || profile === void 0 ? void 0 : profile.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* İlgi Alanları */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Hangi içerikler ilginizi çekiyor?</h2>
            <p className="text-xs text-gray-400 mb-4">Yalnızca seçtiğiniz konularda bülten alırsınız.</p>
            <div className="grid grid-cols-1 gap-2">
              {INTEREST_AREAS.map(function (area) { return (<label key={area.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={interests.has(area.id)} onChange={function () { return toggleInterest(area.id); }} className="w-4 h-4 accent-[#26496b] rounded"/>
                  <span className="text-sm text-gray-700">{area.label}</span>
                </label>); })}
            </div>
          </div>

          {/* Bölge */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Bölgeniz</h2>
            <p className="text-xs text-gray-400 mb-3">Bölgesel etkinlik bildirimleri için kullanılır.</p>
            <select value={region} onChange={function (e) { return setRegion(e.target.value); }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#26496b]/20">
              <option value="">— Seçiniz —</option>
              {REGIONS.map(function (r) { return <option key={r} value={r}>{r}</option>; })}
            </select>
          </div>

          {/* Abonelik */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Abonelik</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={unsubscribed} onChange={function (e) { return setUnsubscribed(e.target.checked); }} className="w-4 h-4 accent-red-500 rounded"/>
              <span className="text-sm text-gray-700">Tüm bültenlerden çıkmak istiyorum</span>
            </label>
            {unsubscribed && (<p className="text-xs text-red-500 mt-2">Kaydet'e tıkladıktan sonra aboneliğiniz iptal edilecek.</p>)}
          </div>
        </div>

        {/* Kaydet */}
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={save} disabled={status === 'saving'} className="w-full bg-[#26496b] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#1d374f] disabled:opacity-50 transition-colors">
            {status === 'saving' ? 'Kaydediliyor…' : 'Tercihleri Kaydet'}
          </button>
          <p className="text-center text-xs text-gray-400">
            Tüm aboneler yalnızca Haritailesi Vakfı&apos;ndan e-posta alır.
          </p>
        </div>
      </div>
    </div>);
}
