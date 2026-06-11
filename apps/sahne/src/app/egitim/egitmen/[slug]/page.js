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
exports.default = InstructorPage;
var link_1 = __importDefault(require("next/link"));
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var api_1 = require("@/lib/api");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, courses, instructor;
        var _c, _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_e.sent()).slug;
                    return [4 /*yield*/, api_1.cms.trainings().catch(function () { return null; })];
                case 2:
                    courses = (_c = _e.sent()) !== null && _c !== void 0 ? _c : [];
                    instructor = courses.find(function (c) { var _a; return ((_a = c.instructor) === null || _a === void 0 ? void 0 : _a.toLowerCase().replace(/\s+/g, '-')) === slug; });
                    return [2 /*return*/, { title: (_d = instructor === null || instructor === void 0 ? void 0 : instructor.instructor) !== null && _d !== void 0 ? _d : 'Eğitmen Profili' }];
            }
        });
    });
}
function InstructorPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, allCourses, myCourses, sample, instructor, avatarKey, bio, title, totalStudents, totalViews, freeCourses;
        var _c, _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_e.sent()).slug;
                    return [4 /*yield*/, api_1.cms.trainings().catch(function () { return []; })];
                case 2:
                    allCourses = (_c = _e.sent()) !== null && _c !== void 0 ? _c : [];
                    myCourses = allCourses.filter(function (c) { var _a; return ((_a = c.instructor) === null || _a === void 0 ? void 0 : _a.toLowerCase().replace(/\s+/g, '-')) === slug; });
                    if (myCourses.length === 0) {
                        return [2 /*return*/, (<>
        <Navbar_1.default />
        <main className="min-h-screen dark:bg-[#070c1a] flex items-center justify-center">
          <p className="text-gray-500 dark:text-slate-400">Eğitmen bulunamadı.</p>
        </main>
      </>)];
                    }
                    sample = myCourses[0];
                    instructor = sample.instructor;
                    avatarKey = sample.instructorAvatarKey;
                    bio = sample.instructorBio;
                    title = sample.instructorTitle;
                    totalStudents = myCourses.reduce(function (s, c) { return s + c.enrollmentCount; }, 0);
                    totalViews = myCourses.reduce(function (s, c) { return s + c.viewCount; }, 0);
                    freeCourses = myCourses.filter(function (c) { return !c.price; }).length;
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#070c1a]">

        {/* Hero */}
        <section className="relative bg-[#0d1b2a] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
          <div className="absolute inset-0 bg-gradient-to-br from-[#26496b]/30 to-transparent pointer-events-none"/>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <link_1.default href="/egitim" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8 group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Tüm Eğitimler
            </link_1.default>

            <div className="flex flex-col sm:flex-row gap-7 items-start">
              {avatarKey ? (<img src={"".concat(API_URL, "/api/v1/media?key=").concat(encodeURIComponent(avatarKey))} alt={instructor} className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/20 shrink-0"/>) : (<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#26496b] to-[#66aca9] text-white flex items-center justify-center text-4xl font-black shrink-0">
                  {(_d = instructor[0]) === null || _d === void 0 ? void 0 : _d.toUpperCase()}
                </div>)}
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#66aca9] mb-2">Eğitmen</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">{instructor}</h1>
                {title && <p className="text-sm font-medium text-slate-400 mb-4">{title}</p>}
                {bio && <p className="text-slate-300 text-sm leading-relaxed max-w-xl">{bio}</p>}
              </div>
            </div>
          </div>
          <div className="h-8 bg-[#f8fafc] dark:bg-[#070c1a]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}/>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
                                { label: 'Kurs', value: myCourses.length, color: 'text-[#26496b] dark:text-blue-400' },
                                { label: 'Öğrenci', value: totalStudents, color: 'text-emerald-600 dark:text-emerald-400' },
                                { label: 'Görüntülenme', value: totalViews, color: 'text-amber-600 dark:text-amber-400' },
                                { label: 'Ücretsiz Kurs', value: freeCourses, color: 'text-violet-600 dark:text-violet-400' },
                            ].map(function (stat) { return (<div key={stat.label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
                <p className={"text-2xl font-black tabular-nums ".concat(stat.color)}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{stat.label}</p>
              </div>); })}
          </div>

          {/* Kurslar */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-gradient-to-b from-[#26496b] to-[#66aca9] rounded-full"/>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Kursları</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCourses.map(function (course) {
                                var _a, _b, _c;
                                return (<link_1.default key={course.id} href={"/egitim/".concat(course.slug)} className="group flex gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className={"w-1.5 rounded-full shrink-0 bg-gradient-to-b ".concat(((_a = course.level) === null || _a === void 0 ? void 0 : _a.includes('Başlangıç')) ? 'from-emerald-400 to-teal-500' :
                                        ((_b = course.level) === null || _b === void 0 ? void 0 : _b.includes('Orta')) ? 'from-amber-400 to-orange-500' :
                                            ((_c = course.level) === null || _c === void 0 ? void 0 : _c.includes('İleri')) ? 'from-rose-400 to-pink-500' :
                                                'from-[#26496b] to-[#66aca9]')}/>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {course.level && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{course.level}</span>}
                    {course.format && <span className="text-[10px] font-semibold bg-[#26496b]/8 dark:bg-blue-900/20 text-[#26496b] dark:text-blue-400 px-2 py-0.5 rounded-full">{course.format}</span>}
                    {!course.price && <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">Ücretsiz</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#26496b] dark:group-hover:text-blue-400 transition-colors leading-snug mb-1">{course.title}</h3>
                  {course.description && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{course.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400 dark:text-slate-500">
                    {course.enrollmentCount > 0 && <span>👤 {course.enrollmentCount}</span>}
                    {course.price && <span className="font-semibold text-gray-700 dark:text-slate-300">{course.price}</span>}
                  </div>
                </div>
                <div className="shrink-0 self-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#26496b] dark:group-hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </link_1.default>);
                            })}
          </div>
        </div>
      </main>
    </>)];
            }
        });
    });
}
