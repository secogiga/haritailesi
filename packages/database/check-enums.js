const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi');
async function run() {
  const r = await sql`SELECT unnest(enum_range(NULL::library_field))::text as val`;
  console.log('library_field values:', r.map(x => x.val).join(', '));
  await sql.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
