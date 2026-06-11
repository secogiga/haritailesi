"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExchangeRate = useExchangeRate;
var react_1 = require("react");
var _cached = null;
function useExchangeRate() {
    var _a = (0, react_1.useState)(function () { var _a; return (_a = _cached === null || _cached === void 0 ? void 0 : _cached.rates) !== null && _a !== void 0 ? _a : null; }), rates = _a[0], setRates = _a[1];
    (0, react_1.useEffect)(function () {
        if (_cached && Date.now() - _cached.fetchedAt < 4 * 60 * 60 * 1000)
            return;
        fetch('/api/exchange-rates')
            .then(function (r) { return r.json(); })
            .then(function (d) {
            _cached = { rates: d.rates, fetchedAt: Date.now() };
            setRates(d.rates);
        })
            .catch(function () { });
    }, []);
    function tryToUsd(amountKurus) {
        if (!(rates === null || rates === void 0 ? void 0 : rates.USD))
            return '';
        return "\u2248 ".concat((amountKurus / 100 * rates.USD).toFixed(0), " USD");
    }
    function tryToEur(amountKurus) {
        if (!(rates === null || rates === void 0 ? void 0 : rates.EUR))
            return '';
        return "\u2248 ".concat((amountKurus / 100 * rates.EUR).toFixed(0), " EUR");
    }
    return { rates: rates, tryToUsd: tryToUsd, tryToEur: tryToEur };
}
