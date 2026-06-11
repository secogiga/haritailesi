"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadata = generateMetadata;
exports.default = EtkinlikDetayPage;
var link_1 = __importDefault(require("next/link"));
var navigation_1 = require("next/navigation");
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var api_1 = require("@/lib/api");
var EtkinlikKayitFormu_1 = require("@/components/EtkinlikKayitFormu");
var DiscussionSection_1 = require("@/components/DiscussionSection");
var ShareMenu_1 = require("@/components/ShareMenu");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var TYPE_LABELS = {
    kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
    webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};
var TYPE_COLORS = {
    kongre: 'bg-violet-100 text-violet-700', networking: 'bg-sky-100 text-sky-700',
    odul: 'bg-amber-100 text-amber-700', webinar: 'bg-teal-100 text-teal-700',
    calistay: 'bg-emerald-100 text-emerald-700', sempozyum: 'bg-indigo-100 text-indigo-700',
    diger: 'bg-gray-100 text-gray-600',
};
var TYPE_HEADER_GRAD = {
    kongre: 'from-violet-700 to-violet-500', networking: 'from-sky-700 to-sky-500',
    odul: 'from-amber-600 to-yellow-500', webinar: 'from-teal-700 to-teal-500',
    calistay: 'from-emerald-700 to-emerald-500', sempozyum: 'from-indigo-700 to-indigo-500',
    diger: 'from-slate-700 to-slate-500',
};
function googleCalendarUrl(title, start, end, location, description) {
    var fmt = function (d) { return new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'; };
    var dates = "".concat(fmt(start), "/").concat(fmt(end !== null && end !== void 0 ? end : start));
    var p = new URLSearchParams(__assign(__assign({ action: 'TEMPLATE', text: title, dates: dates }, (location ? { location: location } : {})), (description ? { details: description } : {})));
    return "https://calendar.google.com/calendar/render?".concat(p.toString());
}
function icalUrl(title, start, end, location, description) {
    var fmt = function (d) { return new Date(d).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'; };
    var lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        "DTSTART:".concat(fmt(start)),
        "DTEND:".concat(fmt(end !== null && end !== void 0 ? end : start)),
        "SUMMARY:".concat(title),
        location ? "LOCATION:".concat(location) : '', description ? "DESCRIPTION:".concat(description) : '',
        'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\n');
    return "data:text/calendar;charset=utf-8,".concat(encodeURIComponent(lines));
}
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, event;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_d.sent()).slug;
                    return [4 /*yield*/, api_1.cms.event(slug)];
                case 2:
                    event = _d.sent();
                    if (!event)
                        return [2 /*return*/, { title: 'Etkinlik Bulunamadı' }];
                    return [2 /*return*/, { title: event.title, description: (_c = event.description) !== null && _c !== void 0 ? _c : undefined }];
            }
        });
    });
}
function EtkinlikDetayPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, event, _c, speakers, sessions, regQuestions, sponsors, discussion, typeLabel, typeColor, headerGrad, isPast, isFull, isOnline, fillPct, startDate, formattedDate, formattedTime, formattedEndDate;
        var _d, _e, _f, _g, _h, _j;
        var params = _b.params;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_k.sent()).slug;
                    return [4 /*yield*/, api_1.cms.event(slug)];
                case 2:
                    event = _k.sent();
                    if (!event || !event.isPublished)
                        (0, navigation_1.notFound)();
                    return [4 /*yield*/, Promise.all([
                            api_1.cms.eventSpeakers(event.id).catch(function () { return null; }),
                            api_1.cms.eventSessions(event.id).catch(function () { return null; }),
                            api_1.cms.eventRegistrationQuestions(event.id).catch(function () { return null; }),
                            api_1.cms.eventSponsors(event.id).catch(function () { return null; }),
                            event.mutfakPostId ? api_1.cms.eventDiscussion(event.mutfakPostId).catch(function () { return null; }) : Promise.resolve(null),
                        ])];
                case 3:
                    _c = _k.sent(), speakers = _c[0], sessions = _c[1], regQuestions = _c[2], sponsors = _c[3], discussion = _c[4];
                    typeLabel = (_d = TYPE_LABELS[event.type]) !== null && _d !== void 0 ? _d : event.type;
                    typeColor = (_e = TYPE_COLORS[event.type]) !== null && _e !== void 0 ? _e : TYPE_COLORS['diger'];
                    headerGrad = (_f = TYPE_HEADER_GRAD[event.type]) !== null && _f !== void 0 ? _f : TYPE_HEADER_GRAD['diger'];
                    isPast = new Date(event.dateStart) < new Date();
                    isFull = event.maxCapacity != null && event.attendeeCount >= event.maxCapacity;
                    isOnline = !!event.meetingUrl && !event.location;
                    fillPct = event.maxCapacity ? Math.min(100, (event.attendeeCount / event.maxCapacity) * 100) : 0;
                    startDate = new Date(event.dateStart);
                    formattedDate = startDate.toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul',
                    });
                    formattedTime = startDate.toLocaleTimeString('tr-TR', {
                        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
                    });
                    formattedEndDate = event.dateEnd
                        ? new Date(event.dateEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })
                        : null;
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <main className="min-h-screen dark:bg-[#070c1a]">

        {/* Hero — kapak görseli veya gradient */}
        {event.coverImageKey ? (<div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
            <img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(event.coverImageKey))} alt={event.title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"/>
            <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <link_1.default href="/etkinlikler" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                Tüm Etkinlikler
              </link_1.default>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full ".concat(typeColor)}>{typeLabel}</span>
                {isOnline && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white">Online</span>}
                {isPast && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Geçmiş</span>}
                {event.isCancelled && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/90 text-white">İptal Edildi</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{event.title}</h1>
            </div>
          </div>) : (<div className={"relative bg-gradient-to-br ".concat(headerGrad, " overflow-hidden")}>
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <circle cx="160" cy="20" r="80" fill="white"/>
                <circle cx="30" cy="90" r="60" fill="white"/>
              </svg>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <link_1.default href="/etkinlikler" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                Tüm Etkinlikler
              </link_1.default>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">{typeLabel}</span>
                {isOnline && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/80 text-white">Online</span>}
                {isPast && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">Geçmiş</span>}
                {event.isCancelled && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-400/80 text-white">İptal Edildi</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight max-w-3xl">{event.title}</h1>
            </div>
          </div>)}

        {/* İçerik + Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

            {/* Sol — Ana içerik */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {event.description && (<p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-8 font-medium">
                  {event.description}
                </p>)}
              {event.body && (<div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-[var(--color-mavi)]">
                  <div dangerouslySetInnerHTML={{ __html: event.body }}/>
                </div>)}
              {!event.description && !event.body && (<div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-10 text-center">
                  <p className="text-gray-400 dark:text-slate-500">Etkinlik detayları yakında eklenecektir.</p>
                </div>)}

              {/* Konuşmacılar */}
              {speakers && speakers.length > 0 && (<div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-5">Konuşmacılar</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {speakers.map(function (sp) {
                                    var _a;
                                    return (<div key={sp.id} className="flex gap-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        {sp.avatarUrl ? (<img src={sp.avatarUrl} alt={sp.name} className="w-14 h-14 rounded-full object-cover shrink-0"/>) : (<div className="w-14 h-14 rounded-full bg-[var(--color-mavi)] text-white flex items-center justify-center text-xl font-bold shrink-0">
                            {(_a = sp.name[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()}
                          </div>)}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-slate-100 leading-snug">{sp.name}</p>
                          {sp.title && <p className="text-sm text-gray-500 dark:text-slate-400">{sp.title}</p>}
                          {sp.affiliation && <p className="text-sm text-gray-400 dark:text-slate-500">{sp.affiliation}</p>}
                          {sp.bio && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{sp.bio}</p>}
                          {sp.linkedinUrl && (<a href={sp.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0a66c2] hover:underline mt-1.5 font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              LinkedIn
                            </a>)}
                        </div>
                      </div>);
                                })}
                  </div>
                </div>)}

              {/* Gündem */}
              {sessions && sessions.length > 0 && (<div className="mt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-5">Program</h2>
                  <div className="space-y-2">
                    {sessions.map(function (ss) {
                                    var isBreak = ss.sessionType === 'break';
                                    return (<div key={ss.id} className={"flex gap-4 rounded-2xl px-5 py-4 ".concat(isBreak ? 'bg-gray-50 dark:bg-slate-800/30' : 'bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700')}>
                          {ss.startTime && (<div className="text-center w-16 shrink-0 pt-0.5">
                              <p className="text-sm font-bold text-[var(--color-mavi)] dark:text-blue-400">
                                {new Date(ss.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                              </p>
                              {ss.endTime && (<p className="text-[11px] text-gray-400">
                                  {new Date(ss.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                                </p>)}
                            </div>)}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full ".concat(ss.sessionType === 'keynote' ? 'bg-amber-100 text-amber-700' :
                                            ss.sessionType === 'panel' ? 'bg-indigo-100 text-indigo-700' :
                                                ss.sessionType === 'workshop' ? 'bg-emerald-100 text-emerald-700' :
                                                    ss.sessionType === 'break' ? 'bg-gray-100 text-gray-500' :
                                                        'bg-blue-100 text-blue-700')}>
                                {ss.sessionType === 'keynote' ? 'Açılış' : ss.sessionType === 'panel' ? 'Panel' :
                                            ss.sessionType === 'workshop' ? 'Atölye' : ss.sessionType === 'break' ? 'Ara' : 'Sunum'}
                              </span>
                              {ss.hall && <span className="text-[10px] text-gray-400">📍 {ss.hall}</span>}
                            </div>
                            <p className={"font-semibold leading-snug ".concat(isBreak ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100')}>{ss.title}</p>
                            {ss.speakerName && (<p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                {ss.speakerName}
                                {ss.speakerAffiliation ? " \u2014 ".concat(ss.speakerAffiliation) : ''}
                              </p>)}
                          </div>
                        </div>);
                                })}
                  </div>
                </div>)}

              {/* Sponsorlar */}
              {sponsors && sponsors.length > 0 && (<div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Sponsorlar</h2>
                  {/* Tier gruplarına ayır ve sırala */}
                  {['platin', 'altin', 'gumus', 'bronz'].map(function (tier) {
                                    var TIER_META = {
                                        platin: { label: '💎 Platin Sponsor', size: 'h-20' },
                                        altin: { label: '🥇 Altın Sponsor', size: 'h-16' },
                                        gumus: { label: '🥈 Gümüş Sponsor', size: 'h-12' },
                                        bronz: { label: '🥉 Bronz Sponsor', size: 'h-10' },
                                    };
                                    var group = sponsors.filter(function (s) { return s.tier === tier; });
                                    if (!group.length)
                                        return null;
                                    var meta = TIER_META[tier];
                                    return (<div key={tier} className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">{meta.label}</p>
                        <div className="flex flex-wrap items-center gap-4">
                          {group.map(function (sp) { return (sp.websiteUrl ? (<a key={sp.id} href={sp.websiteUrl} target="_blank" rel="noopener noreferrer" className={"".concat(meta.size, " flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 hover:shadow-md transition-shadow")}>
                                {sp.logoKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(sp.logoKey))} alt={sp.companyName} className="max-h-full max-w-[140px] object-contain"/>) : (<span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{sp.companyName}</span>)}
                              </a>) : (<div key={sp.id} className={"".concat(meta.size, " flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4")}>
                                {sp.logoKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(sp.logoKey))} alt={sp.companyName} className="max-h-full max-w-[140px] object-contain"/>) : (<span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{sp.companyName}</span>)}
                              </div>)); })}
                        </div>
                      </div>);
                                })}
                  {/* Diğer tier'lar (özel vb.) */}
                  {(function () {
                                    var other = sponsors.filter(function (s) { return !['platin', 'altin', 'gumus', 'bronz'].includes(s.tier); });
                                    if (!other.length)
                                        return null;
                                    return (<div className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Destekçiler</p>
                        <div className="flex flex-wrap items-center gap-3">
                          {other.map(function (sp) { return (<div key={sp.id} className="h-9 flex items-center bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 px-3">
                              {sp.logoKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(sp.logoKey))} alt={sp.companyName} className="max-h-full max-w-[100px] object-contain"/>) : (<span className="text-xs font-medium text-gray-600 dark:text-slate-400">{sp.companyName}</span>)}
                            </div>); })}
                        </div>
                      </div>);
                                })()}
                </div>)}

              {/* Mutfak Tartışma Odası */}
              {discussion && (<DiscussionSection_1.DiscussionSection discussion={discussion} mutfakPostId={event.mutfakPostId}/>)}

              {/* Sosyal Paylaşım */}
              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
                <ShareMenu_1.ShareMenu title={event.title}/>
              </div>
            </div>

            {/* Sağ — Sidebar */}
            <div className="order-1 lg:order-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
                {/* Sidebar header */}
                <div className={"bg-gradient-to-r ".concat(headerGrad, " px-5 py-4")}>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    {isPast ? 'Geçmiş Etkinlik' : event.isCancelled ? 'İptal Edildi' : 'Etkinlik Detayları'}
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Tarih */}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-gray-500 dark:text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Tarih & Saat</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formattedDate}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{formattedTime}
                        {formattedEndDate && formattedEndDate !== formattedDate && " \u2013 ".concat(formattedEndDate)}
                      </p>
                    </div>
                  </div>

                  {/* Lokasyon */}
                  {event.location && (<div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Konum</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{event.location}</p>
                      </div>
                    </div>)}

                  {/* Online rozet */}
                  {isOnline && (<div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Format</p>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Online Etkinlik</p>
                      </div>
                    </div>)}

                  {/* Kapasite */}
                  {event.maxCapacity != null && (<div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Kapasite</span>
                        <span className={"font-semibold ".concat(isFull ? 'text-orange-500' : 'text-gray-600 dark:text-slate-400')}>
                          {event.attendeeCount} / {event.maxCapacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                        <div className={"h-2 rounded-full transition-all ".concat(isFull ? 'bg-orange-400' : 'bg-[var(--color-mavi)]')} style={{ width: "".concat(fillPct, "%") }}/>
                      </div>
                      {isFull && (<p className="text-xs text-orange-500 font-medium mt-1">Kapasite dolmuştur.</p>)}
                    </div>)}

                  {/* Ücretli etkinlik fiyat bilgisi */}
                  {((_g = event.price) !== null && _g !== void 0 ? _g : 0) > 0 && (<div className="flex items-center justify-between py-2 px-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div>
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Bilet Fiyatı</p>
                        <p className="text-lg font-black text-amber-700 dark:text-amber-300">₺{(((_h = event.price) !== null && _h !== void 0 ? _h : 0) / 100).toFixed(2)}</p>
                      </div>
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>)}

                  {/* Kayıt ve katılım butonları */}
                  {!isPast && !event.isCancelled && (<div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2.5">
                      {!isFull && (<>
                          {((_j = event.price) !== null && _j !== void 0 ? _j : 0) > 0 && event.paymentUrl ? (<a href={event.paymentUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                              </svg>
                              Ödeme Yaparak Kayıt Ol
                            </a>) : (<EtkinlikKayitFormu_1.EtkinlikKayitFormu eventId={event.id} eventTitle={event.title} questions={regQuestions !== null && regQuestions !== void 0 ? regQuestions : []} label="Kayıt Ol & Bilet Al"/>)}
                        </>)}
                      {event.meetingUrl && (<a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                          Online Katıl
                        </a>)}
                    </div>)}

                  {/* Takvime ekle */}
                  {!isPast && (<div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">Takvime Ekle</p>
                      <div className="flex gap-2">
                        <a href={googleCalendarUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          Google
                        </a>
                        <a href={icalUrl(event.title, event.dateStart, event.dateEnd, event.location, event.description)} download={"".concat(event.slug, ".ics")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          iCal
                        </a>
                      </div>
                    </div>)}
                </div>
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
