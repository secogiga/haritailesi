const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
Promise.all([
  sql`SELECT COUNT(*) as n FROM library_terms WHERE status='published'`,
  sql`SELECT COUNT(*) as n FROM library_guides WHERE status='published'`,
  sql`SELECT COUNT(*) as n FROM library_documents WHERE status='published'`,
  sql`SELECT COUNT(*) as n FROM library_regulations WHERE status='published'`,
  sql`SELECT COUNT(*) as n FROM library_regulation_follows`,
  sql`SELECT COUNT(*) as n FROM ai_conversations WHERE context='library'`,
  sql`SELECT COUNT(*) as n FROM library_terms WHERE status='draft'`,
  sql`SELECT COUNT(*) as n FROM library_guides WHERE is_featured=true`,
  sql`SELECT SUM(view_count) as total FROM library_terms`,
  sql`SELECT COUNT(*) as n FROM library_regulations WHERE array_length(related_term_slugs,1) > 0`,
  sql`SELECT COUNT(*) as n FROM library_guides WHERE array_length(related_regulation_slugs,1) > 0`,
]).then(([t,g,d,r,f,ai,draft,feat,views,crossR,crossG]) => {
  console.log('=== İçerik ===');
  console.log('Terimler (yayında):', t[0].n);
  console.log('Terimler (taslak):', draft[0].n);
  console.log('Rehberler:', g[0].n, '(öne çıkan:', feat[0].n, ')');
  console.log('Dokümanlar:', d[0].n);
  console.log('Mevzuat:', r[0].n);
  console.log('=== Etkileşim ===');
  console.log('Toplam terim görüntülenme:', views[0].total);
  console.log('Mevzuat takip sayısı:', f[0].n);
  console.log('AI kütüphane konuşmaları:', ai[0].n);
  console.log('=== Cross-link ===');
  console.log('Cross-link olan mevzuat:', crossR[0].n);
  console.log('Cross-link olan rehber:', crossG[0].n);
  sql.end();
}).catch(e => { console.error(e.message); process.exit(1); });
