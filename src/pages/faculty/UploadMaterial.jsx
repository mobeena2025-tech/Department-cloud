import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
  Tag
} from 'lucide-react';
import { api, validatePdfFile, formatFileSize } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function UploadMaterial({ onNavigate }) {
  const { addToast } = useNotification();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [unitNumber, setUnitNumber] = useState(3);
  const [materialType, setMaterialType] = useState('PDF Notes');
  const [title, setTitle] = useState('DBMS Unit 3 - Normalization & BCNF Notes.pdf');
  const [topic, setTopic] = useState('Relational Database Design, Functional Dependencies, and Normalization');
  const [summary, setSummary] = useState('Detailed lecture notes covering 1NF, 2NF, 3NF, BCNF, lossless join decomposition, and minimal cover proofs.');
  const [tags, setTags] = useState('normalization, bcnf, 3nf, functional-dependencies, relational-design');
  const [accessPermissions, setAccessPermissions] = useState('Department Enrolled Only');
  const [downloadPermitted, setDownloadPermitted] = useState(true);

  // Real file chosen by the user (PDF, max 10 MB)
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.getCourses();
        if (res?.courses?.length) {
          setCourses(res.courses);
          setCourseId((prev) => prev || res.courses[0].id);
        }
      } catch (err) {
        addToast(err.message || 'Could not load courses', 'error', 'Courses Unavailable');
      } finally {
        setLoadingCourses(false);
      }
    }
    fetchCourses();
  }, []);

  const handleSmartClassify = async () => {
    if (!selectedFile?.name) return;
    setClassifying(true);
    try {
      const res = await api.smartClassify(selectedFile.name, formatFileSize(selectedFile.size));
      const c = res?.classification;
      if (!c || c.method === 'none') {
        addToast('No suggestion for this file name. Please fill in the details.', 'info', 'Auto-Classify');
      } else {
        if (c.suggestedCourseCode) selectCourseByCode(c.suggestedCourseCode);
        if (c.unitNumber) setUnitNumber(c.unitNumber);
        if (c.suggestedTopic) setTopic(c.suggestedTopic);
        if (c.suggestedTags?.length) setTags(c.suggestedTags.join(', '));
        addToast(`Suggested from the file name: ${c.suggestedCourse}. Please check before publishing.`, 'success', 'Auto-Classify');
      }
    } catch (err) {
      addToast(err.message || 'Auto-classify failed', 'error', 'Auto-Classify');
    } finally {
      setClassifying(false);
    }
  };

  // Course ids are UUIDs; presets and the classifier refer to courses by code.
  const selectCourseByCode = (code) => {
    const match = courses.find((c) => c.code === code);
    if (match) setCourseId(match.id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = validatePdfFile(file);
    if (problem) {
      addToast(problem, 'warning', 'File Rejected');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Presets only fill in metadata; the file itself must be chosen by the user.
  const handleSimulatePreset = (presetType) => {
    if (presetType === 'DBMS_NOTES') {
      selectCourseByCode('CS202');
      setUnitNumber(3);
      setMaterialType('PDF Notes');
      setTitle('DBMS Unit 3 - Normalization & BCNF Notes.pdf');
      setTopic('Relational Database Design, Functional Dependencies & Normalization');
      setSummary('Faculty lecture notes covering 1NF, 2NF, 3NF, BCNF, lossless join decomposition, and minimal cover proofs.');
      setTags('normalization, bcnf, relational-design, 3nf');
    } else if (presetType === 'DBMS_QP') {
      selectCourseByCode('CS202');
      setUnitNumber(3);
      setMaterialType('Question Paper');
      setTitle('Semester 6 DBMS Mid-Term Question Paper (2024).pdf');
      setTopic('Mid-Term Examination Question Bank & Model Solutions');
      setSummary('Mid-term examination question paper for Database Management Systems covering Units 1 to 3.');
      setTags('question-paper, mid-term, dbms, examination');
    } else if (presetType === 'ANN_PPT') {
      selectCourseByCode('AI204');
      setUnitNumber(2);
      setMaterialType('PPT Presentation');
      setTitle('ANN Unit 2 - Deep Neural Networks & Backprop Slides.pptx');
      setTopic('Multivariate Chain Rule, Activation Derivatives & Gradient Flow');
      setSummary('Faculty slide deck detailing gradient vector derivations and backpropagation execution.');
      setTags('ann, backpropagation, deep-learning, slides');
    }
    addToast('Loaded representative academic resource metadata preset.', 'info', 'Preset Loaded');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      addToast('Please provide a resource title.', 'warning', 'Validation Warning');
      return;
    }
    if (!selectedFile) {
      addToast('Please choose a PDF file to upload.', 'warning', 'Validation Warning');
      return;
    }
    if (!courseId) {
      addToast('Please choose a course.', 'warning', 'Validation Warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('courseId', courseId);
      formData.append('unitNumber', String(unitNumber));
      formData.append('materialType', materialType);
      formData.append('topic', topic);
      formData.append('summary', summary);
      formData.append('tags', tags);

      const res = await api.uploadMaterial(formData);
      if (res?.success) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadResult(res.material);
        addToast(
          `Resource "${res.material.title}" indexed and uploaded to department storage.`,
          'success',
          'Upload Successful'
        );
      }
    } catch (err) {
      addToast(err.message || 'Failed to upload material', 'error', 'Upload Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cloud-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-cloud-900">Upload Department Academic Resource</h1>
            <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
              Faculty & Mentor Role
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Store course documents in private department cloud storage with role-based access tokens
          </p>
        </div>

        {/* Quick Demo Presets */}
        <div className="flex items-center gap-1.5 self-start">
          <span className="text-[11px] text-cloud-400 font-medium mr-1">Load Preset:</span>
          <button
            type="button"
            onClick={() => handleSimulatePreset('DBMS_NOTES')}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-cloud-100 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 font-medium transition-colors cursor-pointer"
          >
            DBMS Unit 3 Notes
          </button>
          <button
            type="button"
            onClick={() => handleSimulatePreset('DBMS_QP')}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-cloud-100 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 font-medium transition-colors cursor-pointer"
          >
            DBMS Question Paper
          </button>
          <button
            type="button"
            onClick={() => handleSimulatePreset('ANN_PPT')}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-cloud-100 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 font-medium transition-colors cursor-pointer"
          >
            ANN Unit 2 PPT
          </button>
        </div>
      </div>

      {/* Success Notification Banner if just uploaded */}
      {uploadResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xs text-emerald-900">
                  Resource Successfully Uploaded & Storage Key Assigned
                </h3>
                <p className="text-[11px] text-emerald-700">
                  {uploadResult.title} has been indexed into the Department Academic Cloud.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate ? onNavigate('/faculty/materials') : null}
              className="text-xs text-emerald-800 font-semibold underline hover:text-emerald-900 cursor-pointer"
            >
              View in My Materials &rarr;
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200 font-mono text-[11px] text-cloud-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-cloud-400">Object Storage Key: </span>
              <span className="font-semibold text-brand-700">{uploadResult.storagePath}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-medium">
              Access: {uploadResult.accessPermissions}
            </span>
          </div>
        </div>
      )}

      {/* Main Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: The Upload Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          
          {/* File Dropzone */}
          <div className="cloud-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cloud-800 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                Select Academic Document / File
              </label>
              <button
                type="button"
                onClick={handleSmartClassify}
                disabled={classifying}
                className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-brand-500" />
                {classifying ? 'Analyzing...' : 'Smart Auto-Classify'}
              </button>
            </div>

            <label className="block border-2 border-dashed border-cloud-300 hover:border-brand-400 bg-cloud-50/50 hover:bg-brand-50/20 rounded-xl p-5 text-center transition-colors cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-cloud-800">
                {selectedFile?.name || 'Click to choose a PDF file'}
              </div>
              <div className="text-[11px] text-cloud-500 mt-0.5">
                Supported format: PDF only (Max: 10 MB)
              </div>
              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-cloud-200 text-xs font-mono text-cloud-700">
                  <span className="font-semibold text-brand-700">{selectedFile.name}</span>
                  <span className="text-cloud-400">&bull;</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              )}
            </label>
          </div>

          {/* Academic Organization Fields */}
          <div className="cloud-card p-5 space-y-4">
            <h2 className="text-xs font-bold text-cloud-900 uppercase tracking-wider text-cloud-400">
              Curriculum & Resource Classification
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-cloud-700 mb-1">
                Resource Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DBMS Unit 3 - Normalization & BCNF Notes.pdf"
                className="w-full px-3.5 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            {/* Grid for Subject, Unit, Semester, Material Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Subject / Course */}
              <div>
                <label className="block text-xs font-semibold text-cloud-700 mb-1">
                  Assigned Subject / Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 bg-white focus:outline-none focus:border-brand-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-cloud-700 mb-1">
                  Academic Semester
                </label>
                {/* The semester comes from the selected course. */}
                <div className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-700 bg-cloud-50">
                  {courses.find((c) => c.id === courseId)?.semester
                    ? `Semester ${courses.find((c) => c.id === courseId).semester}`
                    : '—'}
                </div>
              </div>

              {/* Unit Number */}
              <div>
                <label className="block text-xs font-semibold text-cloud-700 mb-1">
                  Curriculum Unit
                </label>
                <select
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value={1}>Unit 1: Foundations & Architecture</option>
                  <option value={2}>Unit 2: Core Formulations & Analysis</option>
                  <option value={3}>Unit 3: Design & Advanced Concepts</option>
                  <option value={4}>Unit 4: Protocols & System Dynamics</option>
                  <option value={5}>Unit 5: Storage & Query Optimization</option>
                </select>
              </div>

              {/* Material Type */}
              <div>
                <label className="block text-xs font-semibold text-cloud-700 mb-1">
                  Resource / Material Type
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="PDF Notes">PDF Notes</option>
                  <option value="PPT Presentation">PPT Presentation</option>
                  <option value="Question Paper">Question Paper</option>
                  <option value="Lab Material">Lab Material</option>
                  <option value="Reference Document">Reference Document</option>
                </select>
              </div>

            </div>

            {/* Topic Specification */}
            <div>
              <label className="block text-xs font-semibold text-cloud-700 mb-1">
                Syllabus Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Relational Database Design, Functional Dependencies, BCNF"
                className="w-full px-3.5 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Summary / Notes */}
            <div>
              <label className="block text-xs font-semibold text-cloud-700 mb-1">
                Resource Summary & Learning Objectives
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary for students and AI assistant search indexing..."
                className="w-full px-3.5 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-cloud-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cloud-400" />
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. normalization, bcnf, relational-design, 3nf"
                className="w-full px-3.5 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Access Control & Permissions */}
          <div className="cloud-card p-5 space-y-4">
            <h2 className="text-xs font-bold text-cloud-900 uppercase tracking-wider text-cloud-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Access Control & Storage Permissions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cloud-700 mb-1">
                  Access Permissions Boundary
                </label>
                <select
                  value={accessPermissions}
                  onChange={(e) => setAccessPermissions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 bg-white"
                >
                  <option value="Department Enrolled Only">Department Enrolled Students Only</option>
                  <option value="Read & Download">Open Access (All Department Batches)</option>
                  <option value="Restricted View Only">Restricted (In-Browser View Only)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="downloadToggle"
                  checked={downloadPermitted}
                  onChange={(e) => setDownloadPermitted(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="downloadToggle" className="text-xs text-cloud-800 cursor-pointer">
                  <span className="font-semibold block">Permit Offline Download</span>
                  <span className="text-[11px] text-cloud-500">Students can download local copy via signed URL</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('/faculty/materials') : null}
              className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 text-xs font-semibold hover:bg-cloud-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              {isSubmitting ? 'Uploading to Department Cloud...' : 'Publish to Department Cloud'}
            </button>
          </div>
        </form>

        {/* Right 1 Col: Cloud Storage Architecture & Information Card */}
        <div className="space-y-4">
          
          {/* Storage Architecture Model */}
          <div className="cloud-card p-5 space-y-3 bg-gradient-to-b from-white to-cloud-50/80">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-700 uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-brand-600" />
              Cloud Storage Architecture
            </div>

            <p className="text-[11px] text-cloud-600 leading-relaxed">
              This application utilizes an enterprise object storage pattern to decouple heavy academic files from structured catalog metadata.
            </p>

            {/* Visual Step-by-step Flow */}
            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-cloud-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-[11px]">
                  <div className="font-semibold text-cloud-900">Faculty Uploads Resource</div>
                  <div className="text-cloud-500">File uploaded through authenticated Express API route.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-cloud-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-[11px]">
                  <div className="font-semibold text-cloud-900">Object Storage Key Assigned</div>
                  <div className="text-cloud-500 font-mono text-[10px] text-brand-700">
                    academic-materials/courses/&lt;course-id&gt;/...
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-cloud-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-[11px]">
                  <div className="font-semibold text-cloud-900">Metadata & Audit in MongoDB</div>
                  <div className="text-cloud-500">Curriculum tags, syllabus unit, and audit log stored.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-cloud-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="text-[11px]">
                  <div className="font-semibold text-cloud-900">Time-bound Pre-Signed URL</div>
                  <div className="text-cloud-500">Registered students receive secure, expiring tokens to download.</div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Simulated private cloud bucket ensures documents are never publicly exposed or shared via unvetted chat links.
              </span>
            </div>
          </div>

          {/* Guidelines Card */}
          <div className="cloud-card p-5 space-y-2 text-xs">
            <h3 className="font-bold text-cloud-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cloud-400" />
              Department Upload Guidelines
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-cloud-600">
              <li>Always tag the official course code and curriculum unit.</li>
              <li>Question papers should include the exam year in the title.</li>
              <li>Lab manuals must include software versions required (e.g. Oracle 19c / PostgreSQL 15).</li>
              <li>All uploads are recorded in the department audit log.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
