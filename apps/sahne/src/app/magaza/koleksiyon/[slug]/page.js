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
exports.default = KoleksiyonPage;
var navigation_1 = require("next/navigation");
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var PageActionTracker_1 = require("@/components/PageActionTracker");
var _client_1 = __importDefault(require("../../_client"));
var CartDrawer_1 = require("@/components/CartDrawer");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function getCollection(slug) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/collections/").concat(slug), { next: { revalidate: 60 } })];
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
function getCollectionProducts(slug) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/products?collection=").concat(slug, "&limit=24&offset=0"), { next: { revalidate: 60 } })];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, { data: [], total: 0, hasMore: false }];
                    return [2 /*return*/, res.json()];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, { data: [], total: 0, hasMore: false }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, col;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_d.sent()).slug;
                    return [4 /*yield*/, getCollection(slug)];
                case 2:
                    col = _d.sent();
                    if (!col)
                        return [2 /*return*/, { title: 'Koleksiyon Bulunamadı' }];
                    return [2 /*return*/, { title: col.title, description: (_c = col.description) !== null && _c !== void 0 ? _c : undefined }];
            }
        });
    });
}
function KoleksiyonPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, _c, col, _d, products, total, hasMore, webUrl, sahneUrl;
        var _e, _f;
        var params = _b.params;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_g.sent()).slug;
                    return [4 /*yield*/, Promise.all([
                            getCollection(slug),
                            getCollectionProducts(slug),
                        ])];
                case 2:
                    _c = _g.sent(), col = _c[0], _d = _c[1], products = _d.data, total = _d.total, hasMore = _d.hasMore;
                    if (!col)
                        (0, navigation_1.notFound)();
                    webUrl = (_e = process.env['NEXT_PUBLIC_WEB_URL']) !== null && _e !== void 0 ? _e : 'https://haritailesi.org';
                    sahneUrl = (_f = process.env['NEXT_PUBLIC_SAHNE_URL']) !== null && _f !== void 0 ? _f : 'http://localhost:3002';
                    return [2 /*return*/, (<>
      <Navbar_1.default />
      <PageActionTracker_1.PageActionTracker actionId="v-magaza-koleksiyon"/>
      <main className="min-h-screen dark:bg-[#070c1a]">
        {/* Hero */}
        <section className="relative bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 py-12 sm:py-16 overflow-hidden">
          {col.coverImage && (<div className="absolute inset-0 opacity-10">
              <img src={col.coverImage} alt="" className="w-full h-full object-cover"/>
            </div>)}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <nav className="text-xs text-gray-400 mb-3">
                  <a href="/magaza" className="hover:text-[#26496b] transition-colors">Mağaza</a>
                  <span className="mx-1.5">›</span>
                  <span className="text-gray-600 dark:text-slate-300">{col.title}</span>
                </nav>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                  {col.title}
                </h1>
                {col.description && (<p className="text-gray-500 dark:text-slate-400 max-w-2xl">{col.description}</p>)}
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">{total} ürün</p>
              </div>
              <CartDrawer_1.CartButton />
            </div>
          </div>
        </section>

        <_client_1.default products={products} total={total} initialHasMore={hasMore} webUrl={webUrl} collectionSlug={slug}/>
      </main>
    </>)];
            }
        });
    });
}
