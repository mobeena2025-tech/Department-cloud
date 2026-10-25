// Make existing PDFs searchable by the assistant (free RAG).
//   npm run index-materials          -> PDFs not indexed yet (pending/failed)
//   npm run index-materials -- --all -> re-index every PDF
import supabase from '../supabase.js';
import { indexMaterial } from '../rag/indexer.js';

const all = process.argv.includes('--all');
let query = supabase.from('materials').select('id, title, index_status').not('storage_path', 'is', null);
if (!all) query = query.in('index_status', ['pending', 'indexing', 'failed']);

const { data, error } = await query;
if (error) {
  console.error('Could not read materials:', error.message);
  console.error('Has supabase/migrations/006_rag_passages.sql been run?');
  process.exit(1);
}
console.log(`${data.length} PDF(s) to index${all ? ' (all)' : ''}.`);

const totals = {};
for (const [i, m] of data.entries()) {
  const t = Date.now();
  const status = await indexMaterial(m.id);
  totals[status] = (totals[status] || 0) + 1;
  console.log(`  [${i + 1}/${data.length}] ${status.padEnd(8)} ${((Date.now() - t) / 1000).toFixed(1)}s  ${m.title}`);
}
console.log('Done:', totals);
process.exit(0);
