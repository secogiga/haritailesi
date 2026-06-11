'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFormatter = BodyFormatter;
var React = require("react");
var URL_RE = /^https?:\/\/\S+$/;
var NUM_RE = /^(\d+)\.\s+(.+)/;
var INLINE_URL_RE = /https?:\/\/\S+/g;
function parse(raw) {
    var paras = raw.split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var blocks = [];
    var i = 0;
    while (i < paras.length) {
        var p = paras[i];
        var numMatch = p.match(NUM_RE);
        if (numMatch) {
            var next = paras[i + 1];
            var url = next && URL_RE.test(next) ? next : null;
            blocks.push({ type: 'item', num: parseInt(numMatch[1]), title: numMatch[2], url: url });
            i += url ? 2 : 1;
            continue;
        }
        if (URL_RE.test(p)) { i++; continue; }
        var words = p.split(/\s+/);
        if (words.every(function (w) { return w.startsWith('#'); })) {
            var existing = blocks.find(function (b) { return b.type === 'hashtags'; });
            if (existing) existing.tags.push.apply(existing.tags, words);
            else blocks.push({ type: 'hashtags', tags: words });
            i++; continue;
        }
        blocks.push({ type: 'intro', text: p });
        i++;
    }
    return blocks;
}
function InlineText(_a) {
    var text = _a.text;
    var parts = [];
    var last = 0;
    var m;
    INLINE_URL_RE.lastIndex = 0;
    while ((m = INLINE_URL_RE.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        parts.push(React.createElement("a", { key: m.index, href: m[0], target: "_blank", rel: "noopener noreferrer", className: "text-[#238179] underline underline-offset-2 hover:text-[#1a6560] break-all" }, m[0]));
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return React.createElement(React.Fragment, null, parts);
}
var NUM_COLORS = [
    'bg-[#238179] text-white',
    'bg-[#26496b] text-white',
    'bg-violet-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-sky-500 text-white',
];
function BodyFormatter(_a) {
    var body = _a.body;
    if (body.includes('<p>') || body.includes('<br') || body.includes('<h')) {
        return React.createElement("div", { dangerouslySetInnerHTML: { __html: body } });
    }
    var blocks = parse(body);
    var items = blocks.filter(function (b) { return b.type === 'item'; });
    var intros = blocks.filter(function (b) { return b.type === 'intro'; });
    var hashBlock = blocks.find(function (b) { return b.type === 'hashtags'; });
    return React.createElement("div", { className: "space-y-5" },
        intros.length > 0 ? React.createElement("blockquote", { className: "pl-5 border-l-[3px] border-[#66aca9] bg-[#26496b] rounded-xl py-4 pr-5" },
            React.createElement("div", { className: "space-y-2 text-white leading-relaxed text-[14px] text-justify italic" },
                intros.map(function (b, i) { return React.createElement("p", { key: i }, React.createElement(InlineText, { text: b.text })); }))) : null,
        items.length > 0 ? React.createElement("div", { className: "space-y-2" },
            items.map(function (item, i) { return React.createElement("div", { key: i, className: "flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-700/50" },
                React.createElement("span", { className: "shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center " + NUM_COLORS[i % NUM_COLORS.length] }, item.num),
                React.createElement("span", { className: "flex-1 text-[13px] font-medium text-gray-800 dark:text-slate-200 leading-snug" }, item.title),
                item.url ? React.createElement("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", className: "shrink-0 flex items-center gap-1 text-[12px] font-semibold text-[#238179] hover:text-white bg-[#238179]/10 hover:bg-[#238179] px-3 py-1.5 rounded-lg transition-all duration-150" },
                    "Bağlantı",
                    React.createElement("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M17 8l4 4m0 0l-4 4m4-4H3" }))) : null); })) : null,
        hashBlock ? React.createElement("div", { className: "flex flex-wrap gap-1.5 pt-1" },
            hashBlock.tags.map(function (tag, i) { return React.createElement("span", { key: i, className: "inline-flex items-center gap-1 bg-[#238179]/10 text-[#238179] dark:bg-[#238179]/20 text-xs font-semibold px-2.5 py-1 rounded-full" }, tag); })) : null);
}
