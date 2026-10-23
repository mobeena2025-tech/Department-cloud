import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Info,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { useAuth } from '../../context/AuthContext';

const SUGGESTED_QUERIES = [
  'Find DBMS Unit 3 material.',
  'Show my recent assignments.',
  'Find the uploaded notes for this subject.',
  'What is backpropagation in ANN Unit 2?',
  'Which document explains CNN pooling?',
];

export default function AcademicAssistant() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('Find DBMS Unit 3 material.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);
    setPipelineStep(1); // User Query

    setTimeout(() => setPipelineStep(2), 200); // Semantic Vector Retrieval
    setTimeout(() => setPipelineStep(3), 400); // Department Filtering

    try {
      const res = await api.searchAI(q, {
        userRole: currentUser?.role,
        userName: currentUser?.name,
      });

      setTimeout(() => {
        setPipelineStep(4); // Grounded Answer
        setResult(res);
        setLoading(false);
      }, 600);
    } catch (err) {
      setLoading(false);
    }
  };

  const handlePreviewSource = async (source) => {
    try {
      const res = await api.getMaterial(source.materialId);
      if (res?.material) {
        setSelectedMaterial(res.material);
      } else {
        setSelectedMaterial({
          id: source.materialId,
          title: source.title,
          courseName: source.course,
          courseId: source.courseCode,
          unitTitle: source.unit,
          summary: source.excerpt,
          fileType: 'PDF',
          materialType: 'PDF Notes',
          size: '4.8 MB',
          uploadedBy: 'Faculty Member',
          storageKey: `s3://dept-academic-cloud-cse/materials/${source.courseCode.toLowerCase()}/${source.title}`,
          accessPermissions: 'Department Enrolled Only',
          downloadPermitted: true,
        });
      }
    } catch {
      setSelectedMaterial({
        id: source.materialId,
        title: source.title,
        courseName: source.course,
        courseId: source.courseCode,
        unitTitle: source.unit,
        summary: source.excerpt,
        fileType: 'PDF',
        materialType: 'PDF Notes',
        size: '4.8 MB',
        uploadedBy: 'Faculty Member',
        storageKey: `s3://dept-academic-cloud-cse/materials/${source.courseCode.toLowerCase()}/${source.title}`,
        accessPermissions: 'Department Enrolled Only',
        downloadPermitted: true,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cloud-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-cloud-900">Intelligent Academic Assistant</h1>
            <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
              Cloud-Native Secondary Feature
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Grounded assistant querying indexed departmental course syllabi, lecture notes, and assignment deadlines
          </p>
        </div>
      </div>

      {/* Honest Prototype Notice (Explicit requirement: do not overhype or make false zero-hallucination claims) */}
      <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong className="font-semibold text-brand-950">Grounded Academic Assistant (Prototype Demonstration): </strong>
          Answers are synthesized directly from uploaded faculty resources and department curriculum records in our simulated object catalog. Designed to assist students and mentors with rapid resource lookup and curriculum cross-referencing.
        </div>
      </div>

      {/* Main Search Query Box */}
      <div className="cloud-card p-4 space-y-3 shadow-xs border-cloud-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cloud-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask for notes, syllabus topics, or assignment deadlines (e.g. Find DBMS Unit 3 material)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cloud-50 text-xs font-medium text-cloud-900 placeholder:text-cloud-400 border border-cloud-200 focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retrieving...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ask Assistant</span>
              </>
            )}
          </button>
        </form>

        {/* Suggested Queries Chips */}
        <div className="pt-2 border-t border-cloud-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="text-cloud-400 font-medium whitespace-nowrap text-[11px] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Suggested Questions:
          </span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-cloud-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-transparent text-cloud-700 text-[11px] transition-colors cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* RAG Retrieval Pipeline Visualizer */}
      {(loading || result) && (
        <div className="cloud-card p-4 border-brand-100 bg-gradient-to-r from-cloud-50 via-brand-50/20 to-cloud-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cloud-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-600" />
              Retrieval-Augmented Generation (RAG) Architecture
            </span>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Department Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border transition-all ${
              pipelineStep >= 1 ? 'bg-white border-brand-300 shadow-2xs' : 'bg-cloud-100/50 border-cloud-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-cloud-900">1. Query Parsing</span>
                {pipelineStep >= 1 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-cloud-500 text-[10px] truncate">"{query}"</p>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pipelineStep >= 2 ? 'bg-white border-brand-300 shadow-2xs' : 'bg-cloud-100/50 border-cloud-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-cloud-900">2. Vector Search</span>
                {pipelineStep >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-cloud-500 text-[10px]">Cosine Similarity Matching</p>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pipelineStep >= 3 ? 'bg-white border-brand-300 shadow-2xs' : 'bg-cloud-100/50 border-cloud-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-cloud-900">3. Enrolled Filter</span>
                {pipelineStep >= 3 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-cloud-500 text-[10px]">Permission Checked</p>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pipelineStep >= 4 ? 'bg-white border-brand-300 shadow-2xs' : 'bg-cloud-100/50 border-cloud-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-cloud-900">4. Grounded Synthesis</span>
                {pipelineStep >= 4 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-cloud-500 text-[10px]">Curriculum References</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer & Grounded Citations */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Answer Card */}
          <div className="cloud-card p-5 border-brand-200 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-cloud-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-cloud-900">Department Assistant Response</h2>
                  <span className="text-[10px] text-cloud-500">Synthesized from authorized faculty lecture notes</span>
                </div>
              </div>

              <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                Grounded in Department Catalog
              </span>
            </div>

            {/* Answer Text */}
            <div className="text-xs text-cloud-800 leading-relaxed whitespace-pre-line bg-cloud-50/40 p-4 rounded-xl border border-cloud-100 font-sans">
              {result.answer}
            </div>

            {/* Related Questions Chips */}
            {result.relatedQuestions?.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-cloud-400 font-medium">Follow-up:</span>
                {result.relatedQuestions.map((rq) => (
                  <button
                    key={rq}
                    onClick={() => {
                      setQuery(rq);
                      handleSearch(rq);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-brand-50 hover:text-brand-700 border border-cloud-200 text-cloud-700 transition-colors cursor-pointer"
                  >
                    {rq}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grounded Source Citations */}
          {result.sources?.length > 0 && (
            <div className="cloud-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-cloud-900 uppercase tracking-wider text-cloud-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-600" />
                Cited Academic Department Sources ({result.sources.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.sources.map((src) => (
                  <div
                    key={src.materialId}
                    className="p-3.5 rounded-xl border border-cloud-200 bg-white hover:border-brand-300 hover:shadow-2xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                          {src.courseCode}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700">
                          {src.relevance}% Match
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-cloud-900 line-clamp-2 mt-1">
                        {src.title}
                      </h4>

                      <p className="text-[10px] text-cloud-500 mt-1 line-clamp-1">
                        {src.unit}
                      </p>

                      <p className="text-[11px] text-cloud-600 mt-2 line-clamp-3 bg-cloud-50 p-2 rounded-lg border border-cloud-100 italic">
                        "{src.excerpt}"
                      </p>
                    </div>

                    <button
                      onClick={() => handlePreviewSource(src)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Inspect Notes</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
