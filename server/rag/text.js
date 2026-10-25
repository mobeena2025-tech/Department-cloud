// PDF text extraction and splitting into passages / sentences.

/** Text of each page of a PDF. Scanned (image-only) PDFs give empty pages. */
export async function extractPdfPages(buffer) {
  const { getDocumentProxy, extractText } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return { totalPages, pages: text.map(cleanText) };
}

export function cleanText(s) {
  return String(s || '')
    .replace(/­/g, '') // soft hyphens
    .replace(/(\w)-\n(\w)/g, '$1$2') // words split across lines
    .replace(/[ \t\f\v\r\n]+/g, ' ')
    .trim();
}

/** Split text into sentences (keeps abbreviations like "e.g." mostly intact). */
export function splitSentences(text) {
  const parts = String(text)
    // Split after . ! ? (but not after a list number like "1."), at bullets,
    // and before numbered list items.
    .split(/(?<=[.!?])(?<!\b\d{1,2}\.)(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|Fig|Eq|No|vs|etc|Sec|Ch)\.)\s+(?=[A-Z0-9("'•-])|\s+•\s+|\s+(?=\d{1,2}\.\s+[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Hard-wrap very long "sentences" (tables, lists without punctuation).
  const out = [];
  for (const p of parts) {
    if (p.length <= 400) out.push(p);
    else for (let i = 0; i < p.length; i += 350) out.push(p.slice(i, i + 350).trim());
  }
  return out.filter((s) => s.length >= 3);
}

/**
 * Passages of about `target` characters built from whole sentences, never
 * crossing a page (so citations can name the page). Consecutive passages
 * share one sentence so an answer split across a boundary is still found.
 */
export function chunkPages(pages, { target = 800, min = 120 } = {}) {
  const chunks = [];
  pages.forEach((pageText, i) => {
    const sentences = splitSentences(pageText);
    let current = [];
    let length = 0;
    const flush = () => {
      const content = current.join(' ').trim();
      if (content.length >= min || (content && chunks.length === 0)) {
        chunks.push({ page: i + 1, content });
      } else if (content && chunks.length && chunks[chunks.length - 1].page === i + 1) {
        chunks[chunks.length - 1].content += ' ' + content; // fold a tiny tail into the previous passage
      } else if (content) {
        chunks.push({ page: i + 1, content });
      }
    };
    for (const s of sentences) {
      if (length + s.length > target && current.length) {
        flush();
        const overlap = current[current.length - 1];
        current = overlap.length < target / 2 ? [overlap] : [];
        length = current.reduce((n, x) => n + x.length + 1, 0);
      }
      current.push(s);
      length += s.length + 1;
    }
    if (current.length) flush();
  });
  return chunks
    .filter((c) => /[A-Za-z]{3}/.test(c.content)) // skip page numbers / empty bits
    .map((c, chunk_index) => ({ ...c, chunk_index }));
}
