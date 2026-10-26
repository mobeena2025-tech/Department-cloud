import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sparkles, HardDrive, Database, Server } from 'lucide-react';
import { api } from '../../services/api';

// Read-only facts about how this deployment works, with live counts.
// (Configuration lives in the server's environment and in Supabase, not here.)
export default function AdminSettings() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.getAnalytics().then((res) => setOverview(res?.analytics?.overview || null)).catch(() => {});
  }, []);

  const n = (v) => (overview ? v ?? '—' : '…');

  const section = (Icon, title, rows) => (
    <div className="cloud-card p-6 space-y-3">
      <h2 className="text-sm font-bold text-cloud-900 pb-2 border-b border-cloud-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-600" />
        {title}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-cloud-500">{label}</dt>
            <dd className="font-semibold text-cloud-900 mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          System Information
        </h1>
        <p className="text-xs text-cloud-500">
          How this deployment is set up. Settings are changed on the server and in Supabase, not on this page.
        </p>
      </div>

      {section(Database, 'Department data', [
        ['Department', 'Artificial Intelligence & Data Science (AI & DS)'],
        ['Syllabus loaded', 'Semester V, AY 2024-25'],
        ['Students / Faculty / Admins', `${n(overview?.totalStudents)} / ${n(overview?.totalFaculty)} / ${n(overview?.totalAdmins)}`],
        ['Courses / Enrollments', `${n(overview?.totalCourses)} / ${n(overview?.totalEnrollments)}`],
        ['Materials / Storage used', `${n(overview?.academicResources)} / ${overview ? `${overview.storageUsedMb} MB` : '…'}`],
        ['Assignments / Submissions (graded)', `${n(overview?.totalAssignments)} / ${n(overview?.totalSubmissions)} (${n(overview?.gradedSubmissions)})`],
      ])}

      {section(Server, 'Application', [
        ['Web app', 'React 18 + Vite + Tailwind CSS'],
        ['API', 'Node.js + Express (same server serves the web app)'],
        ['Hosting', 'Render web service (free plan)'],
        ['Database', 'Supabase PostgreSQL'],
      ])}

      {section(Shield, 'Access control', [
        ['Sign-in', 'Supabase Auth (email + password), checked by the API on every request'],
        ['Roles', 'Student, Faculty, Admin (HOD); stored in profiles'],
        ['Course access', 'Students: enrolled courses only. Faculty: assigned courses only'],
        ['Direct database access', 'Blocked for the public key (Row Level Security with no policies)'],
        ['Sign-in limits', '5 wrong passwords per account, 30 per network address, per 15 minutes'],
        ['First sign-in', 'Temporary / roll-number passwords must be changed before use'],
      ])}

      {section(HardDrive, 'File storage', [
        ['Where', 'Private Supabase Storage bucket (academic-materials)'],
        ['Opening a file', 'Short-lived signed link (1 hour), only for people in the course'],
        ['Course materials', 'PDF, PowerPoint, Word, up to 20 MB'],
        ['Student submissions', 'PDF only, up to 10 MB'],
      ])}

      {section(Sparkles, 'Academic Assistant', [
        ['Method', 'Retrieval only (no paid AI service): finds and quotes passages from course PDFs'],
        ['Text model', 'bge-small-en-v1.5 (384-dimensional embeddings), runs on the server'],
        ['Search', 'pgvector similarity within the user’s own courses, plus keyword matching'],
        ['Syllabus questions', 'Answered from the stored Semester V syllabus'],
      ])}
    </div>
  );
}
