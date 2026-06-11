"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceBlock = PriceBlock;
var useExchangeRate_1 = require("@/hooks/useExchangeRate");
function fmt(kurus) { return "\u20BA".concat((kurus / 100).toFixed(0)); }
function PriceBlock(_a) {
    var price = _a.price, memberPrice = _a.memberPrice;
    var tryToUsd = (0, useExchangeRate_1.useExchangeRate)().tryToUsd;
    var usd = tryToUsd(price);
    return (<div>
      <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{fmt(price)}</div>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-xs text-gray-400 dark:text-slate-500">KDV dahil (%20)</span>
        {usd && (<>
            <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{usd}</span>
          </>)}
      </div>
      {memberPrice && (<div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
          Üye fiyatı: {fmt(memberPrice)}
          <span className="text-xs text-emerald-500/70 ml-1">
            (%{Math.round((1 - memberPrice / price) * 100)} indirim)
          </span>
        </div>)}
    </div>);
}
