import multer from 'multer';
import { HttpError } from './validate.js';

export const BUCKET = 'academic-materials';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const SIGNED_URL_SECONDS = 60 * 60;

// A file must have BOTH the PDF MIME type and a .pdf extension.
export function isAllowedPdf(file) {
  return (
    file?.mimetype === 'application/pdf' &&
    typeof file.originalname === 'string' &&
    file.originalname.toLowerCase().endsWith('.pdf')
  );
}

// The MIME type and extension come from the client, so also check the bytes.
export function hasPdfSignature(buffer) {
  return Buffer.isBuffer(buffer) && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

export function safeFileName(originalName) {
  return String(originalName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (isAllowedPdf(file)) cb(null, true);
    else cb(new HttpError(400, 'Only PDF files are allowed'));
  },
});

// Accept one optional PDF in the "file" field; turn multer errors into
// clean 400/413 responses.
export function uploadSinglePdf(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(413, 'File is larger than 10 MB'));
    }
    if (err instanceof HttpError) return next(err);
    return next(new HttpError(400, 'Invalid upload'));
  });
}

// ---------------------------------------------------------------- course materials
// Faculty may also upload PowerPoint and Word files. Only PDFs can be read by
// the Academic Assistant; the others are download-only.

export const MAX_MATERIAL_BYTES = 20 * 1024 * 1024; // 20 MB (slides are often large)

const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // old .ppt/.doc
const ZIP = Buffer.from('PK\x03\x04', 'latin1'); // .pptx/.docx

export const MATERIAL_TYPES = {
  pdf: { label: 'PDF', mime: 'application/pdf', looksRight: (b) => hasPdfSignature(b) },
  pptx: {
    label: 'PPTX',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    looksRight: (b) => b.subarray(0, 4).equals(ZIP) && b.includes('ppt/'),
  },
  ppt: { label: 'PPT', mime: 'application/vnd.ms-powerpoint', looksRight: (b) => b.subarray(0, 8).equals(OLE) },
  docx: {
    label: 'DOCX',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    looksRight: (b) => b.subarray(0, 4).equals(ZIP) && b.includes('word/'),
  },
  doc: { label: 'DOC', mime: 'application/msword', looksRight: (b) => b.subarray(0, 8).equals(OLE) },
};
export const ALLOWED_MATERIAL_MIME_TYPES = Object.values(MATERIAL_TYPES).map((t) => t.mime);

function extensionOf(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z]+)$/);
  return m ? m[1] : '';
}

/** The material type of an uploaded file, or null if its name or contents don't fit. */
export function materialTypeOf(file) {
  const type = MATERIAL_TYPES[extensionOf(file?.originalname)];
  if (!type || !Buffer.isBuffer(file.buffer)) return null;
  return type.looksRight(file.buffer) ? type : null;
}

const materialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MATERIAL_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    // Browsers report Office types inconsistently, so judge by the extension
    // here and by the file's bytes after upload (materialTypeOf).
    if (MATERIAL_TYPES[extensionOf(file.originalname)]) cb(null, true);
    else cb(new HttpError(400, 'Only PDF, PowerPoint (.ppt/.pptx) and Word (.doc/.docx) files are allowed'));
  },
});

export function uploadSingleMaterial(req, res, next) {
  materialUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(413, 'File is larger than 20 MB'));
    }
    if (err instanceof HttpError) return next(err);
    return next(new HttpError(400, 'Invalid upload'));
  });
}
