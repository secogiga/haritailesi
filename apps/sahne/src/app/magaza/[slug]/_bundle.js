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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleContents = BundleContents;
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
function getBundleContents(slug) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/products/").concat(slug, "/bundle"), { next: { revalidate: 300 } })];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        return [2 /*return*/, []];
                    return [2 /*return*/, res.json()];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fmt(kurus) { return "\u20BA".concat((kurus / 100).toFixed(0)); }
function BundleContents(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var items, totalIndividual, saving;
        var slug = _b.slug, bundlePrice = _b.bundlePrice;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getBundleContents(slug)];
                case 1:
                    items = _c.sent();
                    if (!items.length)
                        return [2 /*return*/, null];
                    totalIndividual = items.reduce(function (s, i) { var _a, _b; return s + ((_b = (_a = i.product) === null || _a === void 0 ? void 0 : _a.price) !== null && _b !== void 0 ? _b : 0) * i.quantity; }, 0);
                    saving = totalIndividual - bundlePrice;
                    return [2 /*return*/, (<div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Bu Pakette Neler Var?</h3>
        {saving > 0 && (<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            {fmt(saving)} tasarruf
          </span>)}
      </div>

      <div className="space-y-2">
        {items.map(function (item, i) {
                                var _a, _b, _c;
                                return (<div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
              {((_a = item.product) === null || _a === void 0 ? void 0 : _a.images[0])
                                        ? <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover"/>
                                        : (((_b = item.product) === null || _b === void 0 ? void 0 : _b.type) === 'digital' ? '📄' : ((_c = item.product) === null || _c === void 0 ? void 0 : _c.type) === 'app' ? '📱' : '📦')}
            </div>
            <div className="flex-1 min-w-0">
              {item.product ? (<a href={"/magaza/".concat(item.product.slug)} className="text-sm font-semibold text-gray-900 dark:text-slate-100 hover:text-[#26496b] dark:hover:text-blue-400 truncate block">
                  {item.product.title}
                </a>) : (<p className="text-sm text-gray-400 dark:text-slate-500">Ürün mevcut değil</p>)}
              {item.quantity > 1 && (<p className="text-xs text-gray-400 dark:text-slate-500">{item.quantity} adet</p>)}
            </div>
            {item.product && (<p className="text-xs font-semibold text-gray-500 dark:text-slate-400 shrink-0">
                {fmt(item.product.price * item.quantity)}
              </p>)}
          </div>);
                            })}
      </div>

      {saving > 0 && (<div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800 flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Ayrı ayrı alsan</span>
          <span className="font-semibold text-gray-400 dark:text-slate-500 line-through">{fmt(totalIndividual)}</span>
        </div>)}
    </div>)];
            }
        });
    });
}
