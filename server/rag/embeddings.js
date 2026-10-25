// Free, local text embeddings with the open bge-small-en-v1.5 model, run on
// this server by @huggingface/transformers. No API key, no per-use cost; the
// model (~34 MB) is downloaded once into .models-cache/ and reused.
import path from 'node:path';

export const EMBEDDING_DIMS = 384;
const MODEL_ID = 'Xenova/bge-small-en-v1.5';
// bge models expect this prefix on questions (not on passages).
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

let embedderPromise = null;
let override = null; // tests inject a fake embedder

async function loadEmbedder() {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.cacheDir = process.env.MODELS_DIR || path.resolve('.models-cache');
  return pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' });
}

// Run model work one job at a time: a small server has little CPU, and
// queuing keeps memory steady when several people ask at once.
let queue = Promise.resolve();
function serial(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function embedRaw(texts) {
  if (override) return override(texts);
  if (!embedderPromise) {
    embedderPromise = loadEmbedder().catch((err) => {
      embedderPromise = null; // allow a retry after a failed download
      throw err;
    });
  }
  const embedder = await embedderPromise;
  const out = await embedder(texts, { pooling: 'cls', normalize: true });
  return out.tolist();
}

/** Embeddings for document passages/sentences, in batches. */
export function embedPassages(texts, batchSize = 16) {
  return serial(async () => {
    const vectors = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      vectors.push(...(await embedRaw(texts.slice(i, i + batchSize))));
    }
    return vectors;
  });
}

/** Embedding for a question. */
export function embedQuery(text) {
  return serial(async () => (await embedRaw([QUERY_PREFIX + text]))[0]);
}

/** Load the model now (used at start-up and by the build step). */
export function warmUp() {
  return embedQuery('warm up');
}

// Vectors are normalised, so the dot product is the cosine similarity.
export function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Tests only: replace the model with a fast deterministic function. */
export function setEmbedderForTests(fn) {
  override = fn;
}
