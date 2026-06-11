"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroCarousel = HeroCarousel;
var react_1 = require("react");
function HeroCarousel(_a) {
    var slides = _a.slides, title = _a.title;
    var _b = (0, react_1.useState)(0), idx = _b[0], setIdx = _b[1];
    if (slides.length === 0) {
        return <div className="w-full h-full min-h-[360px] bg-gradient-to-br from-[#1a2d40] to-[#0c1824]"/>;
    }
    return (<div className="relative w-full h-full min-h-[360px]">
      <img src={slides[idx]} alt={title} className="absolute inset-0 w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0c1824]/25"/>

      {slides.length > 1 && (<>
          <button onClick={function () { return setIdx(function (i) { return (i - 1 + slides.length) % slides.length; }); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all z-10" aria-label="Önceki">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button onClick={function () { return setIdx(function (i) { return (i + 1) % slides.length; }); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all z-10" aria-label="Sonraki">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {slides.map(function (_, i) { return (<button key={i} onClick={function () { return setIdx(i); }} className={"rounded-full transition-all duration-200 ".concat(i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70')} aria-label={"G\u00F6rsel ".concat(i + 1)}/>); })}
          </div>
        </>)}
    </div>);
}
