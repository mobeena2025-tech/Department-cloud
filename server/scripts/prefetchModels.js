// Download the free search model during the build, so the first question
// after a deploy doesn't wait for the download. Needs no API key.
import { warmUp } from '../rag/embeddings.js';

const t = Date.now();
await warmUp();
console.log(`Search model ready in .models-cache/ (${((Date.now() - t) / 1000).toFixed(1)}s)`);
