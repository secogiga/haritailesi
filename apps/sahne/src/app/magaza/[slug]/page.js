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
exports.default = UrunDetayPage;
var navigation_1 = require("next/navigation");
var Navbar_1 = __importDefault(require("@/components/Navbar"));
var PageActionTracker_1 = require("@/components/PageActionTracker");
var _checkout_1 = __importDefault(require("./_checkout"));
var _reviews_1 = require("./_reviews");
var _related_1 = require("./_related");
var _stock_notify_1 = require("./_stock-notify");
var _gallery_1 = require("./_gallery");
var _price_1 = require("./_price");
var _bundle_1 = require("./_bundle");
var ShareMenu_1 = require("@/components/ShareMenu");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function getProduct(slug) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/products/").concat(slug), {
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
        var slug, product;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_c.sent()).slug;
                    return [4 /*yield*/, getProduct(slug)];
                case 2:
                    product = _c.sent();
                    if (!product)
                        return [2 /*return*/, { title: 'Ürün Bulunamadı' }];
                    return [2 /*return*/, {
                            title: product.title,
                            description: product.description.slice(0, 160),
                        }];
            }
        });
    });
}
var TYPE_LABELS = { digital: 'Dijital', physical: 'Fiziksel', app: 'Uygulama' };
var DEFAULT_BADGE_CLS = {
    digital: 'bg-blue-100 text-blue-700',
    physical: 'bg-amber-100 text-amber-700',
    app: 'bg-purple-100 text-purple-700',
};
function fmt(kurus) {
    return "\u20BA".concat((kurus / 100).toFixed(0));
}
function UrunDetayPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var slug, product, jsonLd, webUrl, badgeCls, badgeLabel, outOfStock;
        var _c, _d, _e, _f;
        var params = _b.params;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, params];
                case 1:
                    slug = (_g.sent()).slug;
                    return [4 /*yield*/, getProduct(slug)];
                case 2:
                    product = _g.sent();
                    if (!product)
                        (0, navigation_1.notFound)();
                    jsonLd = {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.title,
                        description: product.description,
                        image: product.images,
                        sku: product.slug,
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'TRY',
                            price: (product.price / 100).toFixed(2),
                            availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                            seller: { '@type': 'Organization', name: 'Haritailesi Vakfı' },
                        },
                    };
                    webUrl = (_c = process.env['NEXT_PUBLIC_WEB_URL']) !== null && _c !== void 0 ? _c : 'https://haritailesi.org';
                    badgeCls = (_e = (_d = product.badgeColor) !== null && _d !== void 0 ? _d : DEFAULT_BADGE_CLS[product.type]) !== null && _e !== void 0 ? _e : 'bg-gray-100 text-gray-600';
                    badgeLabel = (_f = product.badgeLabel) !== null && _f !== void 0 ? _f : TYPE_LABELS[product.type];
                    outOfStock = product.stock !== null && product.stock === 0;
                    return [2 /*return*/, (<>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>
      <Navbar_1.default />
      <PageActionTracker_1.PageActionTracker actionId="v-magaza-urun"/>
      <main className="min-h-screen dark:bg-[#070c1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-8">
            <a href="/magaza" className="hover:text-[#26496b] dark:hover:text-blue-400 transition-colors">Mağaza</a>
            <span className="mx-2">›</span>
            <span className="text-gray-700 dark:text-slate-300">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Sol: Görsel Galerisi */}
            <div className="flex flex-col gap-4">
              <_gallery_1.ProductGallery images={product.images} title={product.title} type={product.type}/>
            </div>

            {/* Sağ: Bilgiler */}
            <div className="flex flex-col">
              <span className={"self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4 ".concat(badgeCls)}>
                {badgeLabel}
              </span>

              <div className="flex items-start gap-2 mb-2">
                <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {product.title}
                </h1>
                <ShareMenu_1.ShareMenu title={product.title} size="sm"/>
              </div>
              {product.subtitle && (<p className="text-sm text-gray-400 dark:text-slate-500 mb-4">{product.subtitle}</p>)}

              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
                {product.description}
              </p>

              {product.tags.length > 0 && (<div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map(function (tag) { return (<span key={tag} className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>); })}
                </div>)}

              {product.stock !== null && (<p className={"text-sm mb-4 font-medium ".concat(product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600')}>
                  {product.stock === 0 ? '• Stok tükendi' : product.stock <= 5 ? "\u2022 Son ".concat(product.stock, " \u00FCr\u00FCn") : "\u2022 Stokta mevcut"}
                </p>)}

              <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mt-auto">
                <div className="mb-4">
                  <_price_1.PriceBlock price={product.price} memberPrice={product.memberPrice}/>
                </div>

                {outOfStock ? (<_stock_notify_1.StockNotifyButton slug={product.slug}/>) : (<div className="space-y-3">
                    <_checkout_1.default product={product}/>
                    <p className="text-xs text-center text-gray-400 dark:text-slate-500">
                      {product.type === 'digital' ? 'Ödeme sonrası indirme linki e-postanıza gönderilir.' : 'Ödeme sonrası 3–5 iş günü içinde kargo.'}
                    </p>
                    <a href="/magaza/siparislerim" className="block text-xs text-center text-[#26496b] dark:text-blue-400 hover:underline">
                      Mevcut siparişimi sorgula →
                    </a>
                  </div>)}

                {product.ownerType === 'seller' && (<p className="mt-3 text-xs text-gray-400 dark:text-slate-500 text-center">
                    Bu ürün bağımsız bir satıcı tarafından sunulmaktadır.
                  </p>)}
              </div>
            </div>
          </div>

          {/* Bundle içerikleri */}
          <_bundle_1.BundleContents slug={product.slug} bundlePrice={product.price}/>

          {/* Yorumlar + Benzer Ürünler */}
          <div className="mt-8 pt-6">
            <_reviews_1.ReviewsSection slug={product.slug} productId={product.id}/>
            <_related_1.RelatedProducts slug={product.slug}/>
          </div>
        </div>
      </main>
    </>)];
            }
        });
    });
}
