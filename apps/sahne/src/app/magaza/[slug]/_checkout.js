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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantSelector = VariantSelector;
exports.default = CheckoutButton;
var react_1 = require("react");
var CartContext_1 = require("@/contexts/CartContext");
var CartDrawer_1 = require("@/components/CartDrawer");
var API_URL = (_a = process.env['NEXT_PUBLIC_API_URL']) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var SAHNE_URL = (_b = process.env['NEXT_PUBLIC_SAHNE_URL']) !== null && _b !== void 0 ? _b : 'http://localhost:3002';
function fmt(kurus) {
    return "\u20BA".concat((kurus / 100).toFixed(0));
}
// ─── Variant Seçici ────────────────────────────────────────────────────────────
function VariantSelector(_a) {
    var variants = _a.variants, selected = _a.selected, onChange = _a.onChange;
    if (!variants.length)
        return null;
    return (<div className="space-y-3 mb-4">
      {variants.map(function (v) {
            var _a;
            return (<div key={v.name}>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {v.name}: <span className="text-gray-900 dark:text-slate-100 normal-case font-bold">{(_a = selected[v.name]) !== null && _a !== void 0 ? _a : '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {v.values.map(function (val) { return (<button key={val} onClick={function () {
                    var _a;
                    return onChange(__assign(__assign({}, selected), (_a = {}, _a[v.name] = val, _a)));
                }} className={"px-3 py-1.5 text-sm rounded-xl border transition-all ".concat(selected[v.name] === val
                        ? 'bg-[#26496b] text-white border-[#26496b]'
                        : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-[#26496b] hover:text-[#26496b]')}>
                {val}
                {v.priceModifier ? <span className="text-xs ml-1 opacity-75">{v.priceModifier > 0 ? "+".concat(fmt(v.priceModifier)) : fmt(v.priceModifier)}</span> : null}
              </button>); })}
          </div>
        </div>);
        })}
    </div>);
}
// ─── EFT Seçeneği ──────────────────────────────────────────────────────────────
function EftInfo(_a) {
    var product = _a.product;
    var _b = (0, react_1.useState)(false), open = _b[0], setOpen = _b[1];
    var _c = (0, react_1.useState)(null), eftData = _c[0], setEftData = _c[1];
    var _d = (0, react_1.useState)(''), email = _d[0], setEmail = _d[1];
    var _e = (0, react_1.useState)(''), name = _e[0], setName = _e[1];
    var _f = (0, react_1.useState)(false), loading = _f[0], setLoading = _f[1];
    function initEft() {
        return __awaiter(this, void 0, void 0, function () {
            var orderRes, order, eftRes, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!email || !name)
                            return [2 /*return*/];
                        setLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, 7, 8]);
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/orders"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ buyerName: name, buyerEmail: email, items: [{ productId: product.id, quantity: 1 }] }),
                            })];
                    case 2:
                        orderRes = _c.sent();
                        return [4 /*yield*/, orderRes.json()];
                    case 3:
                        order = _c.sent();
                        return [4 /*yield*/, fetch("".concat(API_URL, "/api/v1/store/orders/").concat(order.id, "/eft"), { method: 'POST' })];
                    case 4:
                        eftRes = _c.sent();
                        _a = setEftData;
                        return [4 /*yield*/, eftRes.json()];
                    case 5:
                        _a.apply(void 0, [_c.sent()]);
                        return [3 /*break*/, 8];
                    case 6:
                        _b = _c.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    if (!open)
        return (<button onClick={function () { return setOpen(true); }} className="w-full text-sm text-gray-400 dark:text-slate-500 hover:text-[#26496b] dark:hover:text-blue-400 transition-colors py-1">
      EFT / Havale ile öde
    </button>);
    return (<div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">EFT / Havale ile Ödeme</p>
      {!eftData ? (<>
          <input className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="Adınız" value={name} onChange={function (e) { return setName(e.target.value); }}/>
          <input type="email" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100" placeholder="E-posta" value={email} onChange={function (e) { return setEmail(e.target.value); }}/>
          <button disabled={!email || !name || loading} onClick={function () { return void initEft(); }} className="w-full py-2 text-sm font-semibold text-white bg-[#26496b] rounded-xl disabled:opacity-50">
            {loading ? 'Hazırlanıyor…' : 'IBAN Bilgisini Al'}
          </button>
        </>) : (<div className="space-y-1.5 text-sm">
          <p><strong>Banka:</strong> {eftData.bankName}</p>
          <p className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">{eftData.iban}</p>
          <p><strong>Tutar:</strong> {eftData.amount}</p>
          <p><strong>Açıklama:</strong> {eftData.description}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Ödemeniz ulaştıktan sonra siparişiniz işleme alınacaktır.</p>
        </div>)}
    </div>);
}
function CheckoutButton(_a) {
    var product = _a.product;
    var addToCart = (0, CartContext_1.useCart)().addToCart;
    var _b = (0, react_1.useState)({}), selected = _b[0], setSelected = _b[1];
    var _c = (0, react_1.useState)(false), addedToCart = _c[0], setAddedToCart = _c[1];
    var variantsComplete = product.variants.length === 0 ||
        product.variants.every(function (v) { return selected[v.name]; });
    function handleAddToCart() {
        if (!variantsComplete)
            return;
        addToCart(product, 1, selected);
        setAddedToCart(true);
        setTimeout(function () { return setAddedToCart(false); }, 2000);
    }
    return (<div className="space-y-3">
      {product.variants.length > 0 && (<VariantSelector variants={product.variants} selected={selected} onChange={setSelected}/>)}

      <div className="flex items-center gap-2">
        <button onClick={handleAddToCart} disabled={!variantsComplete} className={"flex-1 py-3 text-sm font-semibold rounded-2xl transition-all ".concat(addedToCart
            ? 'bg-green-600 text-white'
            : !variantsComplete
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--color-mavi)] hover:bg-[var(--color-mavi-acik)] text-white')}>
          {addedToCart ? '✓ Sepete Eklendi' : 'Sepete Ekle'}
        </button>
        <CartDrawer_1.CartButton />
      </div>

      {!variantsComplete && product.variants.length > 0 && (<p className="text-xs text-amber-600 dark:text-amber-400">
          Lütfen tüm seçenekleri belirleyin.
        </p>)}

      <EftInfo product={product}/>
    </div>);
}
