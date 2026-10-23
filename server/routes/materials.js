import multer from 'multer';

import express from 'express';
import { recordAuditLog } from '../data/store.js';
import supabase from '../supabase.js';
import { classifyUploadedDocument } from '../services/aiService.js';
import { findCourse, isUuid } from '../lib/courseLookup.js';
import { getDemoUserId } from '../lib/demoAuth.js';
import {
  HttpError,
  asyncHandler,
  optionalInt,
  optionalString,
  requiredString,
} from '../lib/validate.js';
import { MATERIAL_SELECT, toMaterialResponse, formatFileSize } from '../lib/mappers.js';

const router = express.Router();

const BUCKET = 'academic-materials';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const SIGNED_URL_SECONDS = 60 * 60;

// A file must have BOTH the PDF MIME type and a .pdf extension.
export function isAllowedPdf(file) {
  return (
    file?.mimetype === 'application/pdf' &&
    typeof file.originalname === 'string' &&
    file.originalname.toLowerCase().endsWith('.pdf')
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (isAllowedPdf(file)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'Only PDF files are allowed'));
    }
  },
});

// Run multer and turn its errors into clean JSON responses.
function uploadSinglePdf(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new HttpError(413, 'File is larger than 10 MB'));
    }
    if (err instanceof HttpError) return next(err);
    return next(new HttpError(400, 'Invalid upload'));
  });
}

function dbError(context, error) {
  console.error(`${context}:`, error.message);
  return new HttpError(500, 'Database error');
}

function requireMaterialId(id) {
  if (!isUuid(id)) throw new HttpError(400, 'Invalid material id');
  return id;
}

// List materials with filtering
router.get('/', asyncHandler(async (req, res) => {
  const courseId = optionalString(req.query.courseId, 'courseId', { max: 40 });
  const semester = optionalInt(req.query.semester, 'semester', { min: 1, max: 8 });
  const unitNumber = optionalInt(req.query.unitNumber, 'unitNumber', { min: 1, max: 10 });
  const fileType = optionalString(req.query.fileType, 'fileType', { max: 20 });
  const query = optionalString(req.query.query, 'query', { max: 100 });

  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw dbError('Materials list error', error);

  let list = data.map(toMaterialResponse);

  if (courseId !== undefined) {
    list = list.filter((m) => m.courseId === courseId || m.courseCode === courseId);
  }
  if (semester !== undefined) list = list.filter((m) => m.semester === semester);
  if (unitNumber !== undefined) list = list.filter((m) => m.unitNumber === unitNumber);
  if (fileType !== undefined) {
    list = list.filter((m) => m.fileType?.toLowerCase() === fileType.toLowerCase());
  }
  if (query !== undefined) {
    const q = query.toLowerCase();
    list = list.filter((m) =>
      m.title?.toLowerCase().includes(q) ||
      m.topic?.toLowerCase().includes(q) ||
      m.courseName?.toLowerCase().includes(q) ||
      m.courseCode?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, materials: list });
}));

// Single material by ID, with a short-lived signed URL for the PDF
router.get('/:id', asyncHandler(async (req, res) => {
  const id = requireMaterialId(req.params.id);

  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw dbError('Material lookup error', error);
  if (!data) throw new HttpError(404, 'Material not found');

  const material = toMaterialResponse(data);
  material.fileUrl = null;

  if (data.storage_path) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, SIGNED_URL_SECONDS);

    if (signedError) {
      console.error('Signed URL error:', signedError.message);
    } else {
      material.fileUrl = signedData.signedUrl;
    }
  }

  res.json({ success: true, material });
}));

// AI Smart Classification preview endpoint (file name based)
router.post('/smart-classify', asyncHandler(async (req, res) => {
  const fileName = requiredString(req.body?.fileName, 'fileName', { max: 255 });
  const fileSize = optionalString(req.body?.fileSize, 'fileSize', { max: 20 });
  const classification = classifyUploadedDocument(fileName, fileSize);
  res.json({ success: true, classification });
}));

// Upload Material endpoint (Faculty/Admin)
router.post('/', uploadSinglePdf, asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'PDF file is required');

  // The MIME type and extension come from the client; also check the
  // file really starts with the PDF signature.
  if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(400, 'File is not a valid PDF');
  }

  const body = req.body || {};
  const title = requiredString(body.title, 'Title', { max: 200 });
  const courseId = requiredString(body.courseId, 'Course', { max: 40 });
  const unitNum = optionalInt(body.unitNumber, 'Unit number', { min: 1, max: 10 }) ?? 1;
  const topic = optionalString(body.topic, 'Topic', { max: 300 }) ?? null;
  const summary = optionalString(body.summary, 'Summary', { max: 2000 }) ?? null;
  const materialType = optionalString(body.materialType, 'Material type', { max: 50 }) ?? 'PDF';

  // 1. Look up the course BEFORE touching Storage, so a bad course id
  //    never leaves an orphaned file behind.
  const { course, error: courseError } = await findCourse(courseId);
  if (courseError) throw dbError('Course lookup error', courseError);
  if (!course) throw new HttpError(404, 'Course not found');

  // 2. Upload the file under a course-based path.
  const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  const storagePath = `courses/${course.id}/${Date.now()}_${safeFileName}`;

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });
  if (storageError) {
    console.error('Supabase Storage error:', storageError.message);
    throw new HttpError(500, 'Failed to upload PDF to storage');
  }

  // 3. Save the row. Store the storage path, never a URL.
  const uploadedBy = getDemoUserId(req);
  const { data: inserted, error: insertError } = await supabase
    .from('materials')
    .insert({
      course_id: course.id,
      title,
      description: summary,
      unit: String(unitNum),
      topic,
      file_type: 'PDF',
      storage_path: storagePath,
      file_size: req.file.size,
      uploaded_by: uploadedBy,
    })
    .select(MATERIAL_SELECT)
    .single();

  if (insertError) {
    // Remove the uploaded file so the bucket and table stay in sync.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbError('Material insert error', insertError);
  }

  recordAuditLog({
    actorName: uploadedBy || 'Unknown user',
    actorRole: 'faculty',
    action: 'UPLOAD_MATERIAL',
    resource: `${inserted.title} (${course.code} - Unit ${unitNum})`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Uploaded ${formatFileSize(req.file.size)} ${materialType} to ${storagePath}.`,
  });

  res.status(201).json({
    success: true,
    message: 'Material uploaded successfully',
    material: toMaterialResponse(inserted),
  });
}));

// Update material metadata (Faculty/Admin)
router.put('/:id', asyncHandler(async (req, res) => {
  const id = requireMaterialId(req.params.id);
  const body = req.body || {};

  // Only fields that exist as columns can be changed.
  const updates = {};
  if (body.title !== undefined) updates.title = requiredString(body.title, 'title', { max: 200 });
  if (body.topic !== undefined) updates.topic = optionalString(body.topic, 'topic', { max: 300 }) ?? null;
  if (body.summary !== undefined) updates.description = optionalString(body.summary, 'summary', { max: 2000 }) ?? null;
  if (body.unitNumber !== undefined) {
    updates.unit = String(optionalInt(body.unitNumber, 'unitNumber', { min: 1, max: 10 }) ?? 1);
  }
  if (Object.keys(updates).length === 0) throw new HttpError(400, 'Nothing to update');

  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select(MATERIAL_SELECT)
    .maybeSingle();
  if (error) throw dbError('Material update error', error);
  if (!data) throw new HttpError(404, 'Material not found');

  recordAuditLog({
    actorName: getDemoUserId(req) || 'Unknown user',
    actorRole: 'faculty',
    action: 'UPDATE_METADATA',
    resource: `${data.title} (${data.courses?.code || ''})`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Updated ${Object.keys(updates).join(', ')} for material ${id}.`,
  });

  res.json({ success: true, material: toMaterialResponse(data) });
}));

// Delete material: remove the database row and its Storage object
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = requireMaterialId(req.params.id);

  const { data: existing, error: findError } = await supabase
    .from('materials')
    .select('id, title, storage_path')
    .eq('id', id)
    .maybeSingle();
  if (findError) throw dbError('Material lookup error', findError);
  if (!existing) throw new HttpError(404, 'Material not found');

  // Delete the row first: if removing the file then fails, students can no
  // longer see a broken entry, and the stray file is logged for cleanup.
  const { error: deleteError } = await supabase.from('materials').delete().eq('id', id);
  if (deleteError) throw dbError('Material delete error', deleteError);

  if (existing.storage_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([existing.storage_path]);
    if (removeError) {
      console.error(`Storage remove failed for ${existing.storage_path}:`, removeError.message);
    }
  }

  recordAuditLog({
    actorName: getDemoUserId(req) || 'Unknown user',
    actorRole: 'faculty',
    action: 'DELETE_MATERIAL',
    resource: existing.title,
    status: 'SUCCESS',
    severity: 'WARNING',
    details: `Deleted material ${id} and storage object ${existing.storage_path || '(none)'}.`,
  });

  res.json({ success: true, message: 'Material deleted', id });
}));

export default router;
