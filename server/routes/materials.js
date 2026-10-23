import multer from 'multer';

import express from 'express';
import { store, recordAuditLog } from '../data/store.js';
import supabase from '../supabase.js';
import { classifyUploadedDocument } from '../services/aiService.js';
import { findCourse, isUuid } from '../lib/courseLookup.js';

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
      const err = new Error('Only PDF files are allowed');
      err.status = 400;
      cb(err);
    }
  },
});

// Run multer and turn its errors into clean JSON responses.
function uploadSinglePdf(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File is larger than 10 MB' });
    }
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: 'Invalid upload' });
  });
}

// TEMPORARY (Phase 1): reads the user id from the demo token so uploaded_by
// is filled in. This token can be forged; Phase 3 replaces it with real auth.
function getDemoUserId(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const match = token.match(/^demo_token_(.+)_\d+$/);
  return match && isUuid(match[1]) ? match[1] : null;
}

function formatFileSize(bytes) {
  if (typeof bytes !== 'number') return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MATERIAL_SELECT = `
  *,
  courses (
    id,
    code,
    name,
    semester,
    section
  )
`;

// Shape a materials row (with joined course) for the frontend.
function toMaterialResponse(m) {
  return {
    id: m.id,
    courseId: m.course_id,
    courseName: m.courses?.name || '',
    courseCode: m.courses?.code || '',
    semester: m.courses?.semester ?? null,

    title: m.title,
    description: m.description,
    unitNumber: Number(m.unit) || 1,
    unitTitle: `Unit ${Number(m.unit) || 1}`,
    topic: m.topic,

    fileType: m.file_type || 'PDF',
    materialType: m.file_type || 'PDF',
    storagePath: m.storage_path,
    size: formatFileSize(m.file_size),

    uploadDate: m.created_at
      ? new Date(m.created_at).toISOString().split('T')[0]
      : null,
    uploadedBy: m.uploaded_by,
    downloads: 0,

    tags: [],
    summary: m.description || '',
    visibility: 'Department / Enrolled',
    accessPermissions: 'Department Enrolled Only',
    downloadPermitted: true,
  };
}

// List materials with filtering
router.get('/', async (req, res) => {
  try {
    const { courseId, unitNumber, query, fileType, semester } = req.query;

    const { data, error } = await supabase
      .from('materials')
      .select(MATERIAL_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase materials error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch materials' });
    }

    let list = data.map(toMaterialResponse);

    // Filters
    if (courseId) {
      list = list.filter(m => m.courseId === courseId || m.courseCode === courseId);
    }

    if (semester) {
      list = list.filter(m => m.semester === Number(semester));
    }

    if (unitNumber) {
      list = list.filter(m => m.unitNumber === Number(unitNumber));
    }

    if (fileType) {
      list = list.filter(m => m.fileType?.toLowerCase() === String(fileType).toLowerCase());
    }

    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.topic?.toLowerCase().includes(q) ||
        m.courseName?.toLowerCase().includes(q) ||
        m.courseCode?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, materials: list });
  } catch (error) {
    console.error('Materials route error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Single material by ID, with a short-lived signed URL for the PDF
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid material id' });
    }

    const { data, error } = await supabase
      .from('materials')
      .select(MATERIAL_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Material lookup error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch material' });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

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
  } catch (error) {
    console.error('Material details error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// AI Smart Classification preview endpoint
router.post('/smart-classify', (req, res) => {
  const { fileName, fileSize } = req.body;
  if (!fileName) {
    return res.status(400).json({ success: false, message: 'File name is required' });
  }

  const classification = classifyUploadedDocument(fileName, fileSize);
  res.json({ success: true, classification });
});

// Upload Material endpoint (Faculty/Admin)
router.post('/', uploadSinglePdf, async (req, res) => {
  try {
    const { title, courseId, unitNumber, topic, summary, materialType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }
    // The MIME type and extension come from the client; also check the
    // file really starts with the PDF signature.
    if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return res.status(400).json({ success: false, message: 'File is not a valid PDF' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course is required' });
    }
    const unitNum = unitNumber === undefined || unitNumber === '' ? 1 : Number(unitNumber);
    if (!Number.isInteger(unitNum) || unitNum < 1 || unitNum > 10) {
      return res.status(400).json({ success: false, message: 'Unit number must be between 1 and 10' });
    }

    // 1. Look up the course BEFORE touching Storage, so a bad course id
    //    never leaves an orphaned file behind.
    const { course, error: courseError } = await findCourse(String(courseId));
    if (courseError) {
      console.error('Course lookup error:', courseError.message);
      return res.status(500).json({ success: false, message: 'Failed to look up course' });
    }
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // 2. Upload the file under a course-based path.
    const safeFileName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-100);
    const storagePath = `courses/${course.id}/${Date.now()}_${safeFileName}`;

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      console.error('Supabase Storage error:', storageError.message);
      return res.status(500).json({ success: false, message: 'Failed to upload PDF to storage' });
    }

    // 3. Save the row. Store the storage path, never a URL.
    const uploadedBy = getDemoUserId(req);
    const { data: inserted, error: insertError } = await supabase
      .from('materials')
      .insert({
        course_id: course.id,
        title: String(title).trim(),
        description: summary || null,
        unit: String(unitNum),
        topic: topic || null,
        file_type: 'PDF',
        storage_path: storagePath,
        file_size: req.file.size,
        uploaded_by: uploadedBy,
      })
      .select(MATERIAL_SELECT)
      .single();

    if (insertError) {
      console.error('Supabase materials insert error:', insertError.message);
      // Remove the uploaded file so the bucket and table stay in sync.
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return res.status(500).json({ success: false, message: 'Failed to save material to database' });
    }

    recordAuditLog({
      actorName: uploadedBy || 'Unknown user',
      actorRole: 'faculty',
      action: 'UPLOAD_MATERIAL',
      resource: `${inserted.title} (${course.code} - Unit ${unitNum})`,
      status: 'SUCCESS',
      severity: 'INFO',
      details: `Uploaded ${formatFileSize(req.file.size)} ${materialType || 'PDF'} to ${storagePath}.`,
    });

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      material: toMaterialResponse(inserted),
    });
  } catch (error) {
    console.error('Material upload error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Material Metadata endpoint (Faculty/Admin)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const mat = store.materials.find(m => m.id === id);

  if (!mat) {
    return res.status(404).json({ success: false, message: 'Material not found' });
  }

  const {
    title,
    topic,
    unitNumber,
    semester,
    materialType,
    visibility,
    accessPermissions,
    downloadPermitted,
    tags,
    summary,
    editorName = 'Faculty Member'
  } = req.body;

  if (title !== undefined) mat.title = title;
  if (topic !== undefined) mat.topic = topic;
  if (semester !== undefined) mat.semester = Number(semester);
  if (materialType !== undefined) mat.materialType = materialType;
  if (visibility !== undefined) mat.visibility = visibility;
  if (accessPermissions !== undefined) mat.accessPermissions = accessPermissions;
  if (downloadPermitted !== undefined) mat.downloadPermitted = Boolean(downloadPermitted);
  if (summary !== undefined) mat.summary = summary;
  if (tags !== undefined) {
    mat.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  }
  if (unitNumber !== undefined) {
    mat.unitNumber = Number(unitNumber);
    const course = store.courses.find(c => c.id === mat.courseId);
    if (course) {
      const unitObj = course.units.find(u => u.unitNumber === mat.unitNumber);
      mat.unitTitle = `Unit ${mat.unitNumber}: ${unitObj ? unitObj.title : 'Course Unit'}`;
    }
  }

  recordAuditLog({
    actorName: editorName,
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'UPDATE_METADATA',
    resource: `${mat.title} (${mat.courseName})`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Updated metadata for material ID ${id}: Semester ${mat.semester}, Unit ${mat.unitNumber}, Type: ${mat.materialType}`,
  });

  res.json({ success: true, material: mat });
});

// Delete / Archive Material endpoint (Faculty/Admin)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = store.materials.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Material not found' });
  }

  const [deletedMat] = store.materials.splice(index, 1);

  recordAuditLog({
    actorName: 'Faculty / Admin',
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'DELETE_MATERIAL',
    resource: `${deletedMat.title} (${deletedMat.courseName})`,
    status: 'SUCCESS',
    severity: 'WARNING',
    details: `Archived/Removed material with storage key ${deletedMat.storageKey} from active listings.`,
  });

  res.json({ success: true, message: 'Material removed from department cloud', id });
});

export default router;
