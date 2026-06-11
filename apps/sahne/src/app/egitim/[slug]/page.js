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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadata = generateMetadata;
exports.default = EgitimDetayPage;
var react_1 = __importDefault(require("react"));
var link_1 = __importDefault(require("next/link"));
var navigation_1 = require("next/navigation");
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var api_1 = require("@/lib/api");
var CourseEnrollButton_1 = require("@/components/CourseEnrollButton");
var CourseReviews_1 = require("@/components/CourseReviews");
var ShareMenu_1 = require("@/components/ShareMenu");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var MUTFAK_URL = (_b = process.env['NEXT_PUBLIC_MUTFAK_URL']) !== null && _b !== void 0 ? _b : 'https://mutfak.haritailesi.org';
// ─── Renk haritaları ──────────────────────────────────────────────────────────
var LEVEL_PILL = {
    'Başlangıç': 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    'Temel': 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30',
    'Orta': 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    'İleri': 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
};
function getLevelPill(level) {
    if (!level)
        return 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
    for (var _i = 0, _a = Object.entries(LEVEL_PILL); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], v = _b[1];
        if (level.includes(k))
            return v;
    }
    return 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30';
}
// ─── Ders tipi ikonları ───────────────────────────────────────────────────────
var LESSON_ICONS = {
    video: (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
    </svg>),
    text: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>),
    pdf: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
    </svg>),
    quiz: (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>),
    live: (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
    </svg>),
};
var LESSON_COLORS = {
    video: 'text-blue-400 bg-blue-500/10',
    text: 'text-slate-400 bg-slate-500/10',
    pdf: 'text-orange-400 bg-orange-500/10',
    quiz: 'text-violet-400 bg-violet-500/10',
    live: 'text-rose-400 bg-rose-500/10',
};
// ─── Tartışma bölümü ──────────────────────────────────────────────────────────
function CourseDiscussion(_a) {
    var _b;
    var discussion = _a.discussion;
    return (<section>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tartışma</h2>
        {discussion.commentCount > 0 && (<span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
            {discussion.commentCount} yorum
          </span>)}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 mb-4 border border-gray-100 dark:border-slate-700/50">
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{discussion.post.body}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          {(_b = discussion.post.authorName) !== null && _b !== void 0 ? _b : 'Yönetim'} · {new Date(discussion.post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {discussion.comments.length > 0 && (<div className="space-y-3 mb-4">
          {discussion.comments.slice(0, 5).map(function (c) {
                var _a, _b, _c;
                return (<div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {(_b = ((_a = c.authorName) !== null && _a !== void 0 ? _a : '?')[0]) === null || _b === void 0 ? void 0 : _b.toUpperCase()}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex-1">
                <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">{(_c = c.authorName) !== null && _c !== void 0 ? _c : 'Üye'}</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{c.body}</p>
              </div>
            </div>);
            })}
        </div>)}

      <a href={MUTFAK_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#26496b] dark:text-blue-400 hover:gap-3 transition-all">
        Mutfak&apos;ta tartışmaya katıl
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </a>
    </section>);
}
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, course;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_d.sent()).slug;
                    return [4 /*yield*/, api_1.cms.trainingDetail(slug)];
                case 2:
                    course = _d.sent();
                    if (!course)
                        return [2 /*return*/, { title: 'Kurs Bulunamadı' }];
                    return [2 /*return*/, { title: course.title, description: (_c = course.description) !== null && _c !== void 0 ? _c : undefined }];
            }
        });
    });
}
// ─── Sayfa ────────────────────────────────────────────────────────────────────
function EgitimDetayPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, _c, course, reviews, discussion, _d, levelPill, totalHours, totalMins, durationStr, stats;
        var _e, _f;
        var params = _b.params;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_g.sent()).slug;
                    return [4 /*yield*/, Promise.all([
                            api_1.cms.trainingDetail(slug),
                            api_1.cms.trainingReviews(slug),
                        ])];
                case 2:
                    _c = _g.sent(), course = _c[0], reviews = _c[1];
                    if (!course || !course.isPublished)
                        (0, navigation_1.notFound)();
                    if (!course.mutfakPostId) return [3 /*break*/, 4];
                    return [4 /*yield*/, api_1.cms.eventDiscussion(course.mutfakPostId).catch(function () { return null; })];
                case 3:
                    _d = _g.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _d = null;
                    _g.label = 5;
                case 5:
                    discussion = _d;
                    levelPill = getLevelPill(course.level);
                    totalHours = course.totalMinutes ? Math.floor(course.totalMinutes / 60) : null;
                    totalMins = course.totalMinutes ? course.totalMinutes % 60 : null;
                    durationStr = totalHours
                        ? "".concat(totalHours, "s").concat(totalMins ? " ".concat(totalMins, "dk") : '')
                        : course.duration;
                    stats = [
                        course.totalLessons > 0 && { icon: '📚', text: "".concat(course.totalLessons, " ders") },
                        durationStr && { icon: '⏱', text: durationStr },
                        course.enrollmentCount > 0 && { icon: '👤', text: "".concat(course.enrollmentCount, " kay\u0131tl\u0131") },
                        (course.avgRating && course.reviewCount > 0) && { icon: '⭐', text: "".concat(course.avgRating, " (").concat(course.reviewCount, " yorum)") },
                    ].filter(Boolean);
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          {/* Arka plan */}
          {course.coverImageKey ? (<>
              <img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(course.coverImageKey))} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-20"/>
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b2a]/95 via-[#0d1b2a]/80 to-[#0d1b2a]/90"/>
            </>) : (<>
              <div className="absolute inset-0 opacity-[0.04]" style={{
                                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                                    backgroundSize: '28px 28px',
                                }}/>
              <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 to-[#66aca9]/15 pointer-events-none"/>
            </>)}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
            {/* Geri */}
            <link_1.default href="/egitim" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8 group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Tüm Eğitimler
            </link_1.default>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pb-0">

              {/* Sol — başlık */}
              <div className="lg:col-span-3 pb-10 sm:pb-14">
                {/* Etiketler */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {course.level && (<span className={"text-xs font-semibold px-3 py-1 rounded-full ".concat(levelPill)}>
                      {course.level}
                    </span>)}
                  {course.format && (<span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80">
                      {course.format}
                    </span>)}
                  {course.accessLevel === 'public' && (<span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                      Ücretsiz Erişim
                    </span>)}
                </div>

                <div className="flex items-start gap-3 mb-5">
                  <h1 className="flex-1 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight">
                    {course.title}
                  </h1>
                  <ShareMenu_1.ShareMenu title={course.title} size="sm"/>
                </div>

                {course.description && (<p className="text-slate-300 text-base leading-relaxed mb-7 max-w-2xl">
                    {course.description}
                  </p>)}

                {/* İstatistik satırı */}
                {stats.length > 0 && (<div className="flex flex-wrap gap-x-5 gap-y-2 mb-7">
                    {stats.map(function (s) { return (<span key={s.text} className="flex items-center gap-1.5 text-sm text-slate-400">
                        <span>{s.icon}</span>
                        {s.text}
                      </span>); })}
                  </div>)}

                {/* Eğitmen */}
                {course.instructor && (<link_1.default href={"/egitim/egitmen/".concat(encodeURIComponent(course.instructor.toLowerCase().replace(/\s+/g, '-')))} className="inline-flex items-center gap-3 group/inst">
                    {course.instructorAvatarKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(course.instructorAvatarKey))} alt={course.instructor} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shrink-0"/>) : (<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white font-bold shrink-0">
                        {(_e = course.instructor[0]) === null || _e === void 0 ? void 0 : _e.toUpperCase()}
                      </div>)}
                    <div>
                      <p className="text-sm font-semibold text-white group-hover/inst:text-[#66aca9] transition-colors">
                        {course.instructor}
                      </p>
                      {course.instructorTitle && (<p className="text-xs text-slate-500">{course.instructorTitle}</p>)}
                    </div>
                  </link_1.default>)}
              </div>

              {/* Sağ — kart (desktop) */}
              <div className="hidden lg:flex lg:col-span-2 items-end justify-end">
                <div className="w-full max-w-sm bg-white/[0.06] dark:bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-t-3xl overflow-hidden shadow-2xl shadow-black/40">
                  {course.coverImageKey && (<div className="h-44 overflow-hidden">
                      <img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(course.coverImageKey))} alt={course.title} className="w-full h-full object-cover"/>
                    </div>)}
                  <div className="p-5 space-y-4">
                    <div>
                      {course.price ? (<>
                          <p className="text-2xl font-black text-white">{course.price}</p>
                          {course.memberPrice && (<p className="text-xs text-emerald-400 font-semibold mt-0.5">Üye fiyatı: {course.memberPrice}</p>)}
                        </>) : (<p className="text-2xl font-black text-emerald-400">Ücretsiz</p>)}
                    </div>
                    <CourseEnrollButton_1.CourseEnrollButton trainingId={course.id} trainingSlug={course.slug} price={course.price} memberPrice={course.memberPrice} registrationUrl={course.registrationUrl}/>
                    <div className="space-y-2 pt-2 border-t border-white/10 text-sm text-slate-300">
                      {course.level && (<div className="flex justify-between">
                          <span className="text-slate-500">Seviye</span>
                          <span className="font-medium text-white">{course.level}</span>
                        </div>)}
                      {course.totalLessons > 0 && (<div className="flex justify-between">
                          <span className="text-slate-500">Ders Sayısı</span>
                          <span className="font-medium text-white">{course.totalLessons}</span>
                        </div>)}
                      {durationStr && (<div className="flex justify-between">
                          <span className="text-slate-500">Toplam Süre</span>
                          <span className="font-medium text-white">{durationStr}</span>
                        </div>)}
                      {course.startDate && (<div className="flex justify-between">
                          <span className="text-slate-500">Başlangıç</span>
                          <span className="font-medium text-white">
                            {new Date(course.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>)}
                      {course.certificateThreshold && (<div className="flex justify-between">
                          <span className="text-slate-500">Sertifika</span>
                          <span className="font-medium text-emerald-400">%{course.certificateThreshold} ile</span>
                        </div>)}
                    </div>
                    {course.tags && course.tags.length > 0 && (<div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                        {course.tags.map(function (t) { return (<span key={t} className="text-[10px] bg-white/8 text-slate-400 px-2 py-0.5 rounded-md">{t}</span>); })}
                      </div>)}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Alt geçiş */}
          <div className="h-8 bg-[#f8fafc] dark:bg-[#070c1a]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}/>
        </section>

        {/* Mobil kayıt çubuğu */}
        <div className="lg:hidden sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-4 py-3 shadow-sm">
          <CourseEnrollButton_1.CourseEnrollButton trainingId={course.id} trainingSlug={course.slug} price={course.price} memberPrice={course.memberPrice} registrationUrl={course.registrationUrl} compact/>
        </div>

        {/* ── Ana içerik ───────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Sol — içerik */}
            <div className="lg:col-span-3 space-y-12">

              {/* Önkoşullar */}
              {course.prerequisites && course.prerequisites.length > 0 && (<section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Ön Koşullar</h2>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5">
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-3">Bu kursa başlamadan önce tamamlanması önerilen kurslar:</p>
                    <div className="space-y-2">
                      {course.prerequisites.map(function (slug) {
                                    var prereq = null; // server component'te ayrı fetch gerekir, link olarak göster
                                    return (<link_1.default key={slug} href={"/egitim/".concat(slug)} className="flex items-center gap-2.5 text-sm text-[#26496b] dark:text-blue-400 hover:underline font-medium">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/>
                            </svg>
                            {slug.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}
                          </link_1.default>);
                                })}
                    </div>
                  </div>
                </section>)}

              {/* Kurs hakkında */}
              {course.body && (<section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Kurs Hakkında</h2>
                  </div>
                  <div className="prose prose-gray dark:prose-invert max-w-none prose-a:text-[#26496b] dark:prose-a:text-blue-400 prose-headings:font-bold">
                    <div dangerouslySetInnerHTML={{ __html: course.body }}/>
                  </div>
                </section>)}

              {/* Müfredat */}
              {course.sections && course.sections.length > 0 && (<section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Müfredat</h2>
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                      {course.totalLessons} ders{durationStr ? " \u00B7 ".concat(durationStr) : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {course.sections.map(function (section, si) { return (<div key={section.id} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        {/* Bölüm başlık */}
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 dark:bg-slate-800/60">
                          <div className="w-6 h-6 rounded-lg bg-[#26496b]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-black text-[#26496b] dark:text-blue-400">{si + 1}</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm flex-1">{section.title}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{section.lessons.length} ders</span>
                        </div>
                        {/* Dersler */}
                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                          {section.lessons.map(function (lesson) {
                                        var _a, _b;
                                        var icon = (_a = LESSON_ICONS[lesson.contentType]) !== null && _a !== void 0 ? _a : LESSON_ICONS.video;
                                        var iconCls = (_b = LESSON_COLORS[lesson.contentType]) !== null && _b !== void 0 ? _b : LESSON_COLORS.video;
                                        return (<div key={lesson.id} className="flex items-center gap-3 px-5 py-3 group/lesson hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                                <div className={"w-6 h-6 rounded-md flex items-center justify-center shrink-0 ".concat(iconCls)}>
                                  {icon}
                                </div>
                                <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">{lesson.title}</span>
                                <div className="flex items-center gap-2">
                                  {lesson.isFree && (<span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                      Önizleme
                                    </span>)}
                                  {lesson.durationMinutes && (<span className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums">{lesson.durationMinutes}dk</span>)}
                                </div>
                              </div>);
                                    })}
                        </div>
                      </div>); })}
                  </div>
                </section>)}

              {/* Eğitmen */}
              {course.instructor && course.instructorBio && (<section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Eğitmen</h2>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex gap-5">
                      {course.instructorAvatarKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(course.instructorAvatarKey))} alt={course.instructor} className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-2 ring-gray-100 dark:ring-slate-700"/>) : (<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#66aca9] flex items-center justify-center text-white text-2xl font-black shrink-0">
                          {(_f = course.instructor[0]) === null || _f === void 0 ? void 0 : _f.toUpperCase()}
                        </div>)}
                      <div className="flex-1 min-w-0">
                        <link_1.default href={"/egitim/egitmen/".concat(encodeURIComponent(course.instructor.toLowerCase().replace(/\s+/g, '-')))} className="font-bold text-gray-900 dark:text-slate-100 hover:text-[#26496b] dark:hover:text-blue-400 transition-colors">
                          {course.instructor}
                        </link_1.default>
                        {course.instructorTitle && (<p className="text-sm text-[#66aca9] dark:text-teal-400 font-medium mt-0.5">{course.instructorTitle}</p>)}
                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mt-3">{course.instructorBio}</p>
                      </div>
                    </div>
                  </div>
                </section>)}

              {/* Yorumlar */}
              <section>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Değerlendirmeler</h2>
                  {course.avgRating && (<span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                      ★ {course.avgRating} · {course.reviewCount} yorum
                    </span>)}
                </div>
                <CourseReviews_1.CourseReviews reviews={reviews !== null && reviews !== void 0 ? reviews : []} trainingId={course.id} avgRating={course.avgRating} reviewCount={course.reviewCount}/>
              </section>

              {/* Tartışma */}
              {discussion && <CourseDiscussion discussion={discussion}/>}

            </div>

            {/* Sağ — sidebar (desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="sticky top-8 space-y-4">

                {/* Kayıt kartı */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-[#26496b] via-[#66aca9] to-[#26496b]"/>
                  <div className="p-5 space-y-4">
                    <div>
                      {course.price ? (<>
                          <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{course.price}</p>
                          {course.memberPrice && (<p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              Üye fiyatı: {course.memberPrice}
                            </p>)}
                        </>) : (<p className="text-2xl font-black text-emerald-500">Ücretsiz</p>)}
                    </div>

                    <CourseEnrollButton_1.CourseEnrollButton trainingId={course.id} trainingSlug={course.slug} price={course.price} memberPrice={course.memberPrice} registrationUrl={course.registrationUrl}/>

                    <div className="space-y-2.5 pt-3 border-t border-gray-50 dark:border-slate-800 text-sm text-gray-500 dark:text-slate-400">
                      {[
                                course.level ? ['Seviye', course.level] : null,
                                course.format ? ['Format', course.format] : null,
                                course.totalLessons > 0 ? ['Ders Sayısı', "".concat(course.totalLessons, " ders")] : null,
                                durationStr ? ['Toplam Süre', durationStr] : null,
                                course.startDate ? ['Başlangıç', new Date(course.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })] : null,
                                course.certificateThreshold ? ['Sertifika', "%".concat(course.certificateThreshold, " quiz ile")] : null,
                            ].filter(function (x) { return x !== null; }).map(function (_a) {
                                var label = _a[0], value = _a[1];
                                return (<div key={label} className="flex justify-between gap-2">
                          <span>{label}</span>
                          <span className={"font-medium text-gray-900 dark:text-slate-100 text-right ".concat(label === 'Sertifika' ? 'text-emerald-500' : '')}>
                            {value}
                          </span>
                        </div>);
                            })}
                    </div>

                    {course.tags && course.tags.length > 0 && (<div className="pt-3 border-t border-gray-50 dark:border-slate-800 flex flex-wrap gap-1.5">
                        {course.tags.map(function (t) { return (<span key={t} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2.5 py-1 rounded-lg font-medium">
                            {t}
                          </span>); })}
                      </div>)}
                  </div>
                </div>

                {/* Sertifika hatırlatması */}
                {course.certificateThreshold && (<div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">Sertifika Programı</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        Quiz&apos;de %{course.certificateThreshold} veya üstü alarak dijital sertifika kazan.
                      </p>
                    </div>
                  </div>)}
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
