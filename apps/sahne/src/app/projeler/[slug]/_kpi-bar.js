'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiBar = KpiBar;
var React = require("react");
var react_1 = require("react");

function VerticalLabel(_a) {
    var text = _a.text, active = _a.active, color = _a.color, onClick = _a.onClick;
    return React.createElement("button", {
        onClick: onClick,
        className: "flex-1 flex items-center justify-center text-[7px] font-bold tracking-widest transition-colors " + (active ? color : 'text-white/20 hover:text-white/40') + " " + (onClick ? 'cursor-pointer' : 'cursor-default'),
        style: { writingMode: 'vertical-rl', transform: 'rotate(180deg)' }
    }, text);
}

function KpiBar(_a) {
    var viewCount = _a.viewCount, linkedinViewCount = _a.linkedinViewCount;
    var _b = react_1.useState('total'), tab = _b[0], setTab = _b[1];
    var linkedin = linkedinViewCount !== null && linkedinViewCount !== void 0 ? linkedinViewCount : 0;
    var displayCount = tab === 'sahne' ? viewCount : tab === 'linkedin' ? linkedin : Math.max(viewCount, linkedin);
    var displayLabel = tab === 'sahne' ? 'Sahne' : tab === 'linkedin' ? 'LinkedIn' : 'Görüntülenme';

    return React.createElement("div", { className: "grid grid-cols-3 gap-2 pt-1" },
        React.createElement("div", { className: "flex bg-white/5 rounded-xl overflow-hidden" },
            React.createElement("div", { className: "flex flex-col w-6 shrink-0 border-r border-white/10" },
                React.createElement(VerticalLabel, { text: "LINKEDIN", active: tab === 'linkedin', color: "text-[#5fa8e0]", onClick: function() { setTab(tab === 'linkedin' ? 'total' : 'linkedin'); } }),
                React.createElement(VerticalLabel, { text: "SAHNE", active: tab === 'sahne', color: "text-[#66aca9]", onClick: function() { setTab(tab === 'sahne' ? 'total' : 'sahne'); } })),
            React.createElement("div", { className: "flex flex-col items-center justify-center gap-1.5 py-3 px-2 flex-1 cursor-default" },
                React.createElement("svg", { className: "w-5 h-5 text-white/90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })),
                React.createElement("span", { className: "text-sm font-bold text-white/80 leading-none" }, displayCount.toLocaleString('tr-TR')),
                React.createElement("span", { className: "text-[10px] text-white/50 leading-tight" }, displayLabel))),
        React.createElement("div", { className: "flex flex-col items-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 cursor-default" },
            React.createElement("svg", { className: "w-5 h-5 text-white/90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" })),
            React.createElement("span", { className: "text-sm font-bold text-white/80 leading-none" }, "0"),
            React.createElement("span", { className: "text-[10px] text-white/50" }, "Yorum")),
        React.createElement("div", { className: "flex flex-col items-center gap-1.5 bg-white/5 rounded-xl py-3 px-2 cursor-default" },
            React.createElement("svg", { className: "w-5 h-5 text-white/90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" })),
            React.createElement("span", { className: "text-sm font-bold text-white/80 leading-none" }, "0"),
            React.createElement("span", { className: "text-[10px] text-white/50" }, "Beğeni")));
}
