import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import AccessBoundary from './components/common/AccessBoundary';

// Pages
import Login from './pages/Login';
import AcademicAssistant from './pages/assistant/AcademicAssistant';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import CourseDetail from './pages/student/CourseDetail';
import StudentMaterials from './pages/student/StudentMaterials';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import StudentProfile from './pages/student/StudentProfile';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyMaterials from './pages/faculty/FacultyMaterials';
import UploadMaterial from './pages/faculty/UploadMaterial';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import FacultySubmissions from './pages/faculty/FacultySubmissions';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import FacultyStudents from './pages/faculty/FacultyStudents';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminMaterials from './pages/admin/AdminMaterials';
import AdminResources from './pages/admin/AdminResources';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminActivity from './pages/admin/AdminActivity';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  const { currentUser, isStudent, isFaculty, isAdmin } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname !== '/' ? window.location.pathname : (currentUser?.role ? `/${currentUser.role}` : '/student');
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not logged in, show Login page
  if (!currentUser || currentPath === '/login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          if (user.role === 'student') navigate('/student');
          else if (user.role === 'faculty') navigate('/faculty');
          else if (user.role === 'admin') navigate('/admin');
        }}
      />
    );
  }

  // Render Page by Path
  const renderContent = () => {
    // Root or Role Default
    if (currentPath === '/' || currentPath === '/dashboard') {
      if (isStudent) return <StudentDashboard onNavigate={navigate} />;
      if (isFaculty) return <FacultyDashboard onNavigate={navigate} />;
      if (isAdmin) return <AdminDashboard onNavigate={navigate} />;
    }

    // Intelligent Academic Assistant (Accessible to all authenticated roles)
    if (currentPath === '/assistant' || currentPath === '/ai-search') {
      return <AcademicAssistant />;
    }

    // Dynamic Course Details Route: e.g. /courses/AI204 or /courses/CS301
    if (currentPath.startsWith('/courses/')) {
      const courseId = currentPath.split('/')[2] || 'AI204';
      return <CourseDetail courseId={courseId} onNavigate={navigate} />;
    }

    // ==========================================
    // Student Routes
    // ==========================================
    if (currentPath === '/student' || currentPath === '/student/dashboard') {
      return <StudentDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/student/courses') {
      return <StudentCourses onNavigate={navigate} />;
    }
    if (currentPath === '/student/materials') {
      return <StudentMaterials onNavigate={navigate} />;
    }
    if (currentPath === '/student/assignments') {
      return <StudentAssignments onNavigate={navigate} />;
    }
    if (currentPath === '/student/announcements') {
      return <StudentAnnouncements onNavigate={navigate} />;
    }
    if (currentPath === '/student/profile') {
      return <StudentProfile />;
    }

    // ==========================================
    // Faculty Routes (Protected by AccessBoundary)
    // ==========================================
    if (currentPath === '/faculty' || currentPath === '/faculty/dashboard') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Academic Dashboard">
          <FacultyDashboard onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/upload') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Upload Department Academic Resource">
          <UploadMaterial onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/profile') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Profile & Credentials">
          <FacultyProfile />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/courses') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Course Management">
          <StudentCourses onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/materials') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Material Management & Smart Upload">
          <FacultyMaterials onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/assignments') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Assignment Management">
          <FacultyAssignments onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/submissions') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Student Gradebook & Submission Evaluation">
          <FacultySubmissions onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/announcements') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Faculty Announcement Board">
          <FacultyAnnouncements onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/faculty/students') {
      return (
        <AccessBoundary allowedRoles={['faculty', 'admin']} pageTitle="Enrolled Student Roster">
          <FacultyStudents onNavigate={navigate} />
        </AccessBoundary>
      );
    }

    // ==========================================
    // HOD / Admin Routes (Protected by AccessBoundary)
    // ==========================================
    if (currentPath === '/admin' || currentPath === '/admin/overview') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="HOD Department Overview">
          <AdminDashboard onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/students') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Student Directory">
          <AdminUsers defaultRoleFilter="student" />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/faculty') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Faculty Directory">
          <AdminUsers defaultRoleFilter="faculty" />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/users') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department User Provisioning">
          <AdminUsers defaultRoleFilter="ALL" />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/courses') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Course Catalog">
          <AdminCourses onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/materials' || currentPath === '/admin/resources') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Materials Oversight">
          <AdminMaterials onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/analytics') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Analytics & AI Telemetry">
          <AdminAnalytics onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/activity' || currentPath === '/admin/audit-logs') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Security & Access Control Audit Logs">
          <AdminActivity onNavigate={navigate} />
        </AccessBoundary>
      );
    }
    if (currentPath === '/admin/settings') {
      return (
        <AccessBoundary allowedRoles={['admin']} pageTitle="Department Cloud Configuration">
          <AdminSettings onNavigate={navigate} />
        </AccessBoundary>
      );
    }

    // Default fallback to student dashboard
    return <StudentDashboard onNavigate={navigate} />;
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      {renderContent()}
    </AppLayout>
  );
}
