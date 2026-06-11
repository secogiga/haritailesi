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
exports.InlineShare = InlineShare;
exports.SidebarShare = SidebarShare;
exports.ProjectInteractions = ProjectInteractions;
exports.CommentBox = CommentBox;
exports.KpiShare = KpiShare;
exports.ShareButton = ShareButton;
var react_1 = require("react");
// ── Kompakt paylaş ikonları ─────────────────────────────────────────────────
function InlineShare(_a) {
    var url = _a.url, title = _a.title;
    var _b = (0, react_1.useState)(false), copied = _b[0], setCopied = _b[1];
    function copyLink() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.clipboard.writeText(url)];
                    case 1:
                        _a.sent();
                        setCopied(true);
                        setTimeout(function () { return setCopied(false); }, 2000);
                        return [2 /*return*/];
                }
            });
        });
    }
    var linkedinHref = "https://www.linkedin.com/sharing/share-offsite/?url=".concat(encodeURIComponent(url));
    var twitterHref = "https://twitter.com/intent/tweet?url=".concat(encodeURIComponent(url), "&text=").concat(encodeURIComponent(title));
    return (<div className="flex items-center gap-1">
      <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">Paylaş</span>

      <a href={linkedinHref} target="_blank" rel="noopener noreferrer" title="LinkedIn'de Paylaş" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>

      <a href={twitterHref} target="_blank" rel="noopener noreferrer" title="X'te Paylaş" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.255 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>

      <button onClick={copyLink} title="Bağlantıyı Kopyala" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
        {copied ? (<svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>) : (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>)}
      </button>
    </div>);
}
// ── Sidebar paylaş butonları ───────────────────────────────────────────────
function SidebarShare(_a) {
    var url = _a.url, title = _a.title;
    var _b = (0, react_1.useState)(false), copied = _b[0], setCopied = _b[1];
    function copyLink() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.clipboard.writeText(url)];
                    case 1:
                        _a.sent();
                        setCopied(true);
                        setTimeout(function () { return setCopied(false); }, 2000);
                        return [2 /*return*/];
                }
            });
        });
    }
    var linkedinHref = "https://www.linkedin.com/sharing/share-offsite/?url=".concat(encodeURIComponent(url));
    var twitterHref = "https://twitter.com/intent/tweet?url=".concat(encodeURIComponent(url), "&text=").concat(encodeURIComponent(title));
    return (<div className="flex items-center gap-2">
      <a href={linkedinHref} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center hover:bg-[#0a66c2]/20 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>
      <a href={twitterHref} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.255 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <button onClick={copyLink} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        {copied ? (<svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>) : (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>)}
      </button>
    </div>);
}
// ── Beğeni & Favori ──────────────────────────────────────────────────────────
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function getAuthToken() {
    var _a;
    if (typeof window === 'undefined')
        return null;
    return (_a = localStorage.getItem('haritailesi_token')) !== null && _a !== void 0 ? _a : null;
}
function ProjectInteractions(_a) {
    var projectSlug = _a.projectSlug, _b = _a.initialLikeCount, initialLikeCount = _b === void 0 ? 0 : _b, _c = _a.initialFavCount, initialFavCount = _c === void 0 ? 0 : _c, _d = _a.initialCommentCount, initialCommentCount = _d === void 0 ? 0 : _d;
    var _e = (0, react_1.useState)(false), liked = _e[0], setLiked = _e[1];
    var _f = (0, react_1.useState)(false), favorited = _f[0], setFavorited = _f[1];
    var _g = (0, react_1.useState)(initialLikeCount), likeCount = _g[0], setLikeCount = _g[1];
    var _h = (0, react_1.useState)(initialFavCount), favCount = _h[0], setFavCount = _h[1];
    var commentCount = (0, react_1.useState)(initialCommentCount)[0];
    var _j = (0, react_1.useState)(false), loading = _j[0], setLoading = _j[1];
    var _k = (0, react_1.useState)(false), noAuth = _k[0], setNoAuth = _k[1];
    // İlk yüklemede kullanıcı durumunu çek
    (0, react_1.useState)(function () {
        var token = getAuthToken();
        if (!token)
            return;
        fetch("".concat(API_URL, "/api/v1/cms/projects/").concat(projectSlug, "/interactions"), {
            headers: { Authorization: "Bearer ".concat(token) },
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
            var _a, _b, _c, _d;
            setLiked((_a = data.liked) !== null && _a !== void 0 ? _a : false);
            setFavorited((_b = data.favorited) !== null && _b !== void 0 ? _b : false);
            setLikeCount((_c = data.likeCount) !== null && _c !== void 0 ? _c : initialLikeCount);
            setFavCount((_d = data.favoriteCount) !== null && _d !== void 0 ? _d : initialFavCount);
        })
            .catch(function () { });
    });
    function handleLike() {
        return __awaiter(this, void 0, void 0, function () {
            var token, res, data_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = getAuthToken();
                        if (!token) {
                            setNoAuth(true);
                            setTimeout(function () { return setNoAuth(false); }, 3000);
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 4, 5]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/cms/projects/").concat(projectSlug, "/like"), {
                                method: 'POST',
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data_1 = _a.sent();
                        setLiked(data_1.liked);
                        setLikeCount(function (c) { return data_1.liked ? c + 1 : Math.max(0, c - 1); });
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleFavorite() {
        return __awaiter(this, void 0, void 0, function () {
            var token, res, data_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = getAuthToken();
                        if (!token) {
                            setNoAuth(true);
                            setTimeout(function () { return setNoAuth(false); }, 3000);
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 4, 5]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/cms/projects/").concat(projectSlug, "/favorite"), {
                                method: 'POST',
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data_2 = _a.sent();
                        setFavorited(data_2.favorited);
                        setFavCount(function (c) { return data_2.favorited ? c + 1 : Math.max(0, c - 1); });
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="space-y-2">
      {noAuth && (<div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
          Bu özellik için Mutfak üyesi girişi gereklidir.
        </div>)}
      <div className="flex gap-2">
        {/* Beğen */}
        <button onClick={handleLike} disabled={loading} className={"flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all ".concat(liked
            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/40 text-rose-600 dark:text-rose-400'
            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-rose-200 hover:text-rose-500')}>
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span className="text-[10px] font-semibold">{likeCount > 0 ? likeCount : ''} Beğen</span>
        </button>
        {/* Kaydet */}
        <button onClick={handleFavorite} disabled={loading} className={"flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all ".concat(favorited
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-600 dark:text-amber-400'
            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-200 hover:text-amber-500')}>
          <svg className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          <span className="text-[10px] font-semibold">{favCount > 0 ? favCount : ''} Kaydet</span>
        </button>
      </div>
      {commentCount > 0 && (<p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">{commentCount} yorum</p>)}
    </div>);
}
// ── Yorum alanı ────────────────────────────────────────────────────────────
function CommentBox(_a) {
    var projectSlug = _a.projectSlug;
    var _b = (0, react_1.useState)(''), firstName = _b[0], setFirstName = _b[1];
    var _c = (0, react_1.useState)(''), lastName = _c[0], setLastName = _c[1];
    var _d = (0, react_1.useState)(''), email = _d[0], setEmail = _d[1];
    var _e = (0, react_1.useState)(''), body = _e[0], setBody = _e[1];
    var _f = (0, react_1.useState)(false), submitting = _f[0], setSubmitting = _f[1];
    var _g = (0, react_1.useState)('idle'), state = _g[0], setState = _g[1];
    var _h = (0, react_1.useState)(''), errorMsg = _h[0], setErrorMsg = _h[1];
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res, err, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        e.preventDefault();
                        if (!body.trim() || !firstName.trim() || !lastName.trim() || !email.trim())
                            return [2 /*return*/];
                        setSubmitting(true);
                        setErrorMsg('');
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/cms/projects/").concat(projectSlug, "/comments"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), body: body.trim() }),
                            })];
                    case 2:
                        res = _c.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                    case 3:
                        err = _c.sent();
                        setErrorMsg((_b = err.message) !== null && _b !== void 0 ? _b : 'Bir hata oluştu, tekrar dene.');
                        return [2 /*return*/];
                    case 4:
                        setState('pending');
                        return [3 /*break*/, 7];
                    case 5:
                        _a = _c.sent();
                        setErrorMsg('Bağlantı hatası, tekrar dene.');
                        return [3 /*break*/, 7];
                    case 6:
                        setSubmitting(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    var inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#26496b]/20 focus:border-[#26496b] dark:focus:border-[#66aca9] transition';
    return (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200 mb-3">Yorum Yaz</p>

      {state === 'pending' ? (<div className="space-y-2 py-2">
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span className="font-semibold">Doğrulama e-postası gönderildi!</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Yorumun yayınlanması için e-postanı kontrol et ve bağlantıya tıkla.
          </p>
          <button onClick={function () { return setState('idle'); }} className="text-xs text-[#26496b] dark:text-[#66aca9] underline mt-1">
            Başka bir yorum yaz
          </button>
        </div>) : (<form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input value={firstName} onChange={function (e) { return setFirstName(e.target.value); }} placeholder="Ad" required minLength={2} className={inputCls}/>
            <input value={lastName} onChange={function (e) { return setLastName(e.target.value); }} placeholder="Soyad" required minLength={2} className={inputCls}/>
          </div>
          <input type="email" value={email} onChange={function (e) { return setEmail(e.target.value); }} placeholder="E-posta adresi" required className={inputCls}/>
          <textarea value={body} onChange={function (e) { return setBody(e.target.value); }} placeholder="Bu proje hakkında bir şeyler yaz…" rows={3} required minLength={10} className={"".concat(inputCls, " resize-none")}/>
          {errorMsg && (<p className="text-xs text-red-500">{errorMsg}</p>)}
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Yorumun yayınlanmadan önce e-posta doğrulaması gerektirir.
          </p>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || !body.trim() || !firstName.trim() || !lastName.trim() || !email.trim()} className="px-4 py-1.5 text-xs font-semibold bg-[#26496b] text-white rounded-lg hover:bg-[#1a3350] disabled:opacity-40 transition-colors">
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </div>
        </form>)}
    </div>);
}
function ShareButton(_a) {
    var url = _a.url;
    function share() {
        if (navigator.share) {
            navigator.share({ url: url }).catch(function () { });
        }
        else {
            navigator.clipboard.writeText(url).catch(function () { });
        }
    }
    return (<button onClick={share} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
      </svg>
      <span className="text-sm">Paylaş</span>
    </button>);
}
function KpiShare(_a) {
    var url = _a.url;
    function share() {
        if (navigator.share) {
            navigator.share({ url: url }).catch(function () { });
        }
        else {
            navigator.clipboard.writeText(url).catch(function () { });
        }
    }
    return (<button onClick={share} className="flex flex-col items-center justify-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 hover:bg-white/10 transition-colors w-full cursor-pointer">
      <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
      </svg>
      <span className="text-[10px] text-white/50">Paylaş</span>
    </button>);
}
