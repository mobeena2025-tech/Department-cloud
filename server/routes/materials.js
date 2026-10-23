import multer from 'multer';

import express from 'express';
import { store, recordAuditLog } from '../data/store.js';
import supabase from '../supabase.js';
import { classifyUploadedDocument } from '../services/aiService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (
  file.mimetype === 'application/pdf' ||
  file.originalname.toLowerCase().endsWith('.pdf')
) {
  cb(null, true);
} else {
  cb(new Error('Only PDF files are allowed'));
}
  }
});

// List materials with filtering
// List materials with filtering
router.get('/', async (req, res) => {
  try {
    const { courseId, unitNumber, query, fileType, semester } = req.query;

    let dbQuery = supabase
      .from('materials')
      .select(`
        *,
        courses (
          id,
          code,
          name,
          semester,
          section
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Supabase materials error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch materials',
        error: error.message
      });
    }

    let list = data.map(m => ({
      id: m.id,
      courseId: m.course_id,
      courseName: m.courses?.name || '',
      courseCode: m.courses?.code || '',
      semester: m.courses?.semester || 5,

      title: m.title,
      description: m.description,
      unitNumber: Number(m.unit) || 1,
      unitTitle: m.title,
      topic: m.topic,

      fileType: m.file_type || 'PDF',
      fileUrl: m.file_url,

      materialType: m.file_type || 'PDF Notes',
      uploadDate: m.created_at
        ? new Date(m.created_at).toISOString().split('T')[0]
        : null,

      uploadedBy: m.uploaded_by,
      downloads: 0,

      tags: [],
      summary: m.description || '',
      visibility: 'Department / Enrolled',
      accessPermissions: 'Department Enrolled Only',
      downloadPermitted: true
    }));

    // Filters
    if (courseId) {
      list = list.filter(m =>
        m.courseId === courseId ||
        m.courseCode === courseId
      );
    }

    if (semester) {
      list = list.filter(m => m.semester === Number(semester));
    }

    if (unitNumber) {
      list = list.filter(m => m.unitNumber === Number(unitNumber));
    }

    if (fileType) {
      list = list.filter(m =>
        m.fileType?.toLowerCase() === fileType.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();

      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.topic?.toLowerCase().includes(q) ||
        m.courseName?.toLowerCase().includes(q) ||
        m.courseCode?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      materials: list
    });

  } catch (error) {
    console.error('Materials route error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Single material by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        courses (
          id,
          code,
          name,
          semester,
          section
        )
      `)
      .eq('id', id)
      .single();

    console.log('Material lookup:', id, data, error);

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    const material = {
      id: data.id,
      courseId: data.course_id,
      courseName: data.courses?.name || '',
      courseCode: data.courses?.code || '',
      semester: data.courses?.semester || 5,

      title: data.title,
      description: data.description,
      unitNumber: Number(data.unit) || 1,
      unitTitle: data.title,
      topic: data.topic,

      fileType: data.file_type || 'PDF',
      fileUrl: data.file_url,

      materialType: data.file_type || 'PDF Notes',
      uploadDate: data.created_at
        ? new Date(data.created_at).toISOString().split('T')[0]
        : null,

      uploadedBy: data.uploaded_by,
      downloads: 0,
      tags: []
    };

    let signedUrl = null;

    
if (data.file_url) {
  const { data: files, error: listError } = await supabase.storage
  .from('academic-materials')
  .list('sem5');

console.log('Storage list error:', listError);
console.log('Storage files:', files);

  const { data: signedData, error: signedError } =
    await supabase.storage
      .from('academic-materials')
      .createSignedUrl(data.file_url, 60 * 60);

  if (signedError) {
    console.error('Signed URL error:', signedError);
  } else {
    signedUrl = signedData.signedUrl;
  }
}

material.fileUrl = signedUrl;
    res.json({
      success: true,
      material
    });

  } catch (error) {
    console.error('Material details error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
router.post('/', upload.single('file'), async (req, res) => {
  const {
    title,
    fileName,
    courseId,
    unitNumber,
    topic,
    fileType = 'PDF',
    materialType = 'PDF Notes',
    semester,
    size = '4.5 MB',
    visibility = 'Department / Enrolled',
    accessPermissions = 'Department Enrolled Only',
    downloadPermitted = true,
    tags = [],
    summary,
    uploadedBy = 'Dr. Demo Faculty A',
  } = req.body;

  if (!title && !fileName) {
    return res.status(400).json({
      success: false,
      message: 'Title or file is required'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'PDF file is required'
    });
  }

  const SafeFileName = req.file.originalname.replace(
    /[^a-zA-Z0-9._-]/g,
    '_'
  );

  const storagePath = `sem5/${Date.now()}_${SafeFileName}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('academic-materials')
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });

  if (storageError) {
    console.error('Supabase Storage error:', storageError);

    return res.status(500).json({
      success: false,
      message: 'Failed to upload PDF to storage',
      error: storageError.message
    });
  }

  console.log('PDF uploaded:', storageData.path);

  // existing code continues here...
  

  const { data: course, error: courseError } = await supabase
  .from('courses')
  .select('*')
  .or(`id.eq.${courseId},code.eq.${courseId}`)
  .single();

if (courseError || !course) {
  return res.status(404).json({
    success: false,
    message: 'Course not found',
    error: courseError?.message
  });
}
  const unitNum = Number(unitNumber) || 1;
  const unitObj = null;
  const actualSemester = Number(semester) || course.semester || 6;
  const safeFileName = (fileName || title || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');

  const newMaterial = {
  id: `mat_${course.id.toLowerCase()}_${Date.now()}`,
  courseId: course.id,
  courseName: course.name
,
  semester: actualSemester,
  materialType,
  unitNumber: unitNum,
  unitTitle: `Unit ${unitNum}: ${unitObj ? unitObj.title : 'Course Unit'}`,
  title: title || fileName,
  topic: topic || 'Course Academic Notes',
  fileType: (fileType || 'PDF').toUpperCase(),
  size: size || '3.8 MB',
  pages: Math.floor(Math.random() * 30) + 15,
  uploadedBy,
  uploadDate: new Date().toISOString().split('T')[0],
  downloads: 0,
  visibility,
  accessPermissions,
  downloadPermitted: Boolean(downloadPermitted),

  fileUrl: storageData.path,
  storageKey: storageData.path,
  storageStatus: 'Supabase Private Storage',

  tags: Array.isArray(tags)
    ? tags
    : (typeof tags === 'string'
      ? tags.split(',').map(t => t.trim())
      : ['academic notes']),

  summary: summary || `Academic department resource for ${course.name
} covering ${topic || 'curriculum principles'}.`,

  contentPreview: `DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
COURSE: ${course.code} - ${course.name
.toUpperCase()}
SEMESTER: ${actualSemester} | UNIT ${unitNum}: ${unitObj ? unitObj.title : ''}
MATERIAL TYPE: ${materialType}
STORAGE PATH: ${storageData.path}

TOPIC: ${topic || 'Academic Syllabus Material'}
INSTRUCTOR: ${uploadedBy}

[Supabase Private Storage]: Stored in the private academic-materials bucket.`
};

  const { data: insertedMaterial, error: insertError } = await supabase
  .from('materials')
  .insert({
    course_id: course.id,
    title: newMaterial.title,
    description: newMaterial.summary,
    unit: String(unitNum),
    topic: newMaterial.topic,
    file_type: newMaterial.fileType,
    file_url: newMaterial.fileUrl
  })
  .select()
  .single();

if (insertError) {
  console.error('Supabase materials insert error:', insertError);

  // If DB insert fails, remove the uploaded file so we don't
  // leave an orphaned PDF in Storage.
  await supabase.storage
    .from('academic-materials')
    .remove([storageData.path]);

  return res.status(500).json({
    success: false,
    message: 'Failed to save material to database',
    error: insertError.message
  });
}

  recordAuditLog({
    actorName: uploadedBy,
    actorRole: 'faculty',
    actorEmail: 'demo.user@example.edu',
    action: 'UPLOAD_MATERIAL',
    resource: `${newMaterial.title} (${course.code} - Unit ${unitNum})`,
    status: 'SUCCESS',
    severity: 'INFO',
    details: `Uploaded ${newMaterial.size} ${newMaterial.materialType} [${newMaterial.storageKey}] to department storage.`,
  });

  res.status(201).json({
  success: true,
  message: 'Material uploaded successfully',
  material: {
    ...newMaterial,
    id: insertedMaterial.id
  }
});
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
