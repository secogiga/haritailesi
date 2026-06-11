'use client';

const URL_RE = /^https?:\/\/\S+$/;
const NUM_RE = /^(\d+)\.\s+(.+)/;
const HASH_RE = /^(#[\wğüşıöçĞÜŞİÖÇ]+(\s+#[\wğüşıöçĞÜŞİÖÇ]+)*)$/;
const INLINE_URL_RE = /https?:\/\/\S+/g;

type Block =
  | { type: 'intro'; text: string }
  | { type: 'item'; num: number; title: string; url: string | null }
  | { type: 'hashtags'; tags: string[] };

function parse(raw: string): Block[] {
  const paras = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const blocks: Block[] = [];
  let i = 0;

  while (i < paras.length) {
    const p = paras[i]!;
    const numMatch = p.match(NUM_RE);

    if (numMatch) {
      const next = paras[i + 1];
      const url = next && URL_RE.test(next) ? next : null;
      blocks.push({ type: 'item', num: parseInt(numMatch[1]!), title: numMatch[2]!, url });
      i += url ? 2 : 1;
      continue;
    }

    if (URL_RE.test(p)) { i++; continue; } // orphan URL — skip (already consumed above)

    // Hashtag-only block
    const words = p.split(/\s+/);
    if (words.every((w) => w.startsWith('#'))) {
      const existing = blocks.find((b) => b.type === 'hashtags') as Extract<Block, { type: 'hashtags' }> | undefined;
      if (existing) existing.tags.push(...words);
      else blocks.push({ type: 'hashtags', tags: words });
      i++; continue;
    }

    blocks.push({ type: 'intro', text: p });
    i++;
  }

  return blocks;
}

function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_URL_RE.lastIndex = 0;
  while ((m = INLINE_URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[0]} target="_blank" rel="noopener noreferrer"
        className="text-[#238179] underline underline-offset-2 hover:text-[#1a6560] break-all">
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const NUM_COLORS = [
  'bg-[#238179] text-white',
  'bg-[#26496b] text-white',
  'bg-violet-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-sky-500 text-white',
];

export function BodyFormatter({ body }: { body: string }) {
  if (body.includes('<p>') || body.includes('<br') || body.includes('<h')) {
    return <div dangerouslySetInnerHTML={{ __html: body }} />;
  }

  const blocks = parse(body);
  const items = blocks.filter((b) => b.type === 'item') as Extract<Block, { type: 'item' }>[];
  const intros = blocks.filter((b) => b.type === 'intro') as Extract<Block, { type: 'intro' }>[];
  const hashBlock = blocks.find((b) => b.type === 'hashtags') as Extract<Block, { type: 'hashtags' }> | undefined;

  return (
    <div className="space-y-5">
      {/* Giriş metni */}
      {intros.length > 0 && (
        <blockquote className="pl-5 border-l-[3px] border-[#66aca9] bg-[#26496b] rounded-xl py-4 pr-5">
          <div className="space-y-2 text-white leading-relaxed text-[14px] text-justify italic">
            {intros.map((b, i) => (
              <p key={i}><InlineText text={b.text} /></p>
            ))}
          </div>
        </blockquote>
      )}

      {/* Numaralı maddeler */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-700/50">
              <span className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${NUM_COLORS[i % NUM_COLORS.length]}`}>
                {item.num}
              </span>
              <span className="flex-1 text-[13px] font-medium text-gray-800 dark:text-slate-200 leading-snug">
                {item.title}
              </span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 text-[12px] font-semibold text-[#238179] hover:text-white bg-[#238179]/10 hover:bg-[#238179] px-3 py-1.5 rounded-lg transition-all duration-150">
                  Bağlantı
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hashtag'ler */}
      {hashBlock && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {hashBlock.tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-[#238179]/10 text-[#238179] dark:bg-[#238179]/20 text-xs font-semibold px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
