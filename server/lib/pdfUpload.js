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
