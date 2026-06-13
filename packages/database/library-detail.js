const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
Promise.all([
  sql`SELECT slug, title, array_length(related_term_slugs,1) as terms FROM library_regulations ORDER BY title`,
  sql`SELECT type, COUNT(*) as n FROM library_guides GROUP BY type ORDER BY n DESC`,
  sql`SELECT field, COUNT(*) as n FROM (SELECT unnest(field) as field FROM library_terms WHERE status='published') t GROUP BY field ORDER BY n DESC LIMIT 10`,
]).then(([regs, guideTypes, fields]) => {
  console.log('Mevzuat listesi:');
  regs.forEach(r => console.log(' -', r.slug, '| cross-link terim:', r.terms ?? 0));
  console.log('\nRehber tipleri:', guideTypes.map(g => g.type + ':' + g.n).join(', '));
  console.log('Terim alan dağılımı:', fields.map(f => f.field + ':' + f.n).join(', '));
  sql.end();
}).catch(e => { console.error(e.message); process.exit(1); });
