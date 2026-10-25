// Turns an uploaded PDF into searchable passages:
//   PDF -> text per page -> passages -> embeddings -> material_chunks table.
// Runs in the background after an upload; one material at a time.
import supabase from '../supabase.js';
import { BUCKET } from '../lib/pdfUpload.js';
import { extractPdfPages, chunkPages } from './text.js';
import { embedPassages } from './embeddings.js';

const MAX_CHUNKS = 2000; // a 10 MB PDF is far below this; guards odd files

async function setStatus(materialId, fields) {
  const { error } = await supabase.from('materials').update(fields).eq('id', materialId);
  if (error) console.error(`[RAG] could not update status for ${materialId}:`, error.message);
}

async function downloadPdf(storagePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error) throw new Error(`download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Index one material. `buffer` is optional (it is downloaded from Storage
 * when missing). Never throws: failures are recorded on the material.
 * Returns the final status.
 */
export async function indexMaterial(materialId, buffer = null) {
  const { data: material, error } = await supabase
    .from('materials')
    .select('id, course_id, title, storage_path')
    .eq('id', materialId)
    .maybeSingle();
  if (error || !material) {
    console.error(`[RAG] material ${materialId} not found`, error?.message || '');
    return 'failed';
  }
  if (!material.storage_path) {
    await setStatus(materialId, { index_status: 'no_text', index_error: 'No file stored', chunk_count: 0 });
    return 'no_text';
  }

  await setStatus(materialId, { index_status: 'indexing', index_error: null });
  try {
    const pdf = buffer || (await downloadPdf(material.storage_path));
    const { totalPages, pages } = await extractPdfPages(pdf);
    const chunks = chunkPages(pages).slice(0, MAX_CHUNKS);

    // Replace any older passages for this material.
    const del = await supabase.from('material_chunks').delete().eq('material_id', materialId);
    if (del.error) throw new Error(`clearing old passages failed: ${del.error.message}`);

    if (!chunks.length) {
      await setStatus(materialId, {
        index_status: 'no_text',
        index_error: 'No selectable text found (it may be a scanned PDF).',
        page_count: totalPages,
        chunk_count: 0,
        indexed_at: new Date().toISOString(),
      });
      return 'no_text';
    }

    const vectors = await embedPassages(chunks.map((c) => c.content));
    const rows = chunks.map((c, i) => ({
      material_id: materialId,
      course_id: material.course_id,
      page: c.page,
      chunk_index: c.chunk_index,
      content: c.content,
      embedding: vectors[i],
    }));
    for (let i = 0; i < rows.length; i += 100) {
      const ins = await supabase.from('material_chunks').insert(rows.slice(i, i + 100));
      if (ins.error) throw new Error(`saving passages failed: ${ins.error.message}`);
    }

    await setStatus(materialId, {
      index_status: 'indexed',
      index_error: null,
      page_count: totalPages,
      chunk_count: rows.length,
      indexed_at: new Date().toISOString(),
    });
    console.log(`[RAG] indexed "${material.title}": ${totalPages} pages, ${rows.length} passages`);
    return 'indexed';
  } catch (err) {
    console.error(`[RAG] indexing "${material.title}" failed:`, err.message);
    await setStatus(materialId, { index_status: 'failed', index_error: String(err.message).slice(0, 300) });
    return 'failed';
  }
}

// ---- background queue (one material at a time) ----
let chain = Promise.resolve();
const queued = new Set();

/** Queue a material for indexing; returns immediately. */
export function enqueueIndex(materialId, buffer = null) {
  if (queued.has(materialId)) return;
  queued.add(materialId);
  chain = chain
    .then(() => indexMaterial(materialId, buffer))
    .catch(() => {})
    .finally(() => queued.delete(materialId));
}

/** Queue every material that is not indexed yet (e.g. after a restart). */
export async function resumePending() {
  const { data, error } = await supabase
    .from('materials')
    .select('id')
    .in('index_status', ['pending', 'indexing']);
  if (error) {
    // Column missing = migration 006 not run yet; RAG simply stays off.
    console.warn('[RAG] not resuming indexing:', error.message);
    return 0;
  }
  data.forEach((m) => enqueueIndex(m.id));
  return data.length;
}

/** Wait until the background queue is empty (used by scripts and tests). */
export function idle() {
  return chain;
}
