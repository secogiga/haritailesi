"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductGallery = ProductGallery;
var react_1 = require("react");
var TYPE_ICON = { digital: '📄', physical: '📦', app: '📱' };
function ProductGallery(_a) {
    var _b;
    var images = _a.images, title = _a.title, type = _a.type;
    var _c = (0, react_1.useState)(0), active = _c[0], setActive = _c[1];
    if (!images.length) {
        return (<div className="aspect-square bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-center text-6xl">
        <span>{(_b = TYPE_ICON[type]) !== null && _b !== void 0 ? _b : '📦'}</span>
      </div>);
    }
    return (<div className="flex flex-col gap-3">
      {/* Ana görsel */}
      <div className="relative aspect-square bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden group">
        <img src={images[active]} alt={"".concat(title, " \u2014 g\u00F6rsel ").concat(active + 1)} className="w-full h-full object-cover transition-opacity duration-200"/>

        {/* Sol/Sağ ok — birden fazla görsel varsa */}
        {images.length > 1 && (<>
            <button onClick={function () { return setActive(function (i) { return (i - 1 + images.length) % images.length; }); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700" aria-label="Önceki">
              ‹
            </button>
            <button onClick={function () { return setActive(function (i) { return (i + 1) % images.length; }); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700" aria-label="Sonraki">
              ›
            </button>

            {/* Nokta indikatörü */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map(function (_, i) { return (<button key={i} onClick={function () { return setActive(i); }} className={"w-1.5 h-1.5 rounded-full transition-all ".concat(i === active ? 'bg-white scale-125' : 'bg-white/50')} aria-label={"G\u00F6rsel ".concat(i + 1)}/>); })}
            </div>
          </>)}
      </div>

      {/* Thumbnail şeridi */}
      {images.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {images.map(function (img, i) { return (<button key={i} onClick={function () { return setActive(i); }} className={"shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ".concat(i === active ? 'border-[#26496b] dark:border-blue-400 ring-1 ring-[#26496b]/30' : 'border-gray-100 dark:border-slate-700 hover:border-[#26496b]/50')}>
              <img src={img} alt={"".concat(title, " ").concat(i + 1)} className="w-full h-full object-cover"/>
            </button>); })}
        </div>)}
    </div>);
}
