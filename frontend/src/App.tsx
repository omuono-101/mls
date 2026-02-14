import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './dashboards/Login';
import AdminDashboard from './dashboards/AdminDashboard';
import CourseMasterDashboard from './dashboards/CourseMasterDashboard';
import HODDashboard from './dashboards/HODDashboard';
import EnhancedTrainerDashboard from './dashboards/EnhancedTrainerDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import LessonViewer from './dashboards/LessonViewer';
import AssessmentSubmission from './dashboards/AssessmentSubmission';
import Unauthorized from './dashboards/Unauthorized';
import AdminSettings from './dashboards/AdminSettings';
import CourseStructure from './dashboards/CourseStructure';
import CourseManagement from './dashboards/CourseManagement';
import TrainerCourseManagement from './dashboards/TrainerCourseManagement';
import LessonEditor from './dashboards/LessonEditor';
import AssessmentAuthoring from './dashboards/AssessmentAuthoring';

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'Admin': return <Navigate to="/admin" />;
    case 'CourseMaster': return <Navigate to="/course-master" />;
    case 'HOD': return <Navigate to="/hod" />;
    case 'Trainer': return <Navigate to="/trainer" />;
    case 'Student': return <Navigate to="/student" />;
    default: return <Navigate to="/login" />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } />

          <Route path="/course-master/*" element={
            <ProtectedRoute allowedRoles={['CourseMaster', 'Admin']}>
              <CourseMasterDashboard />
            </ProtectedRoute>
          } />

          <Route path="/course-master/intakes" element={
            <ProtectedRoute allowedRoles={['CourseMaster', 'Admin']}>
              <CourseStructure />
            </ProtectedRoute>
          } />

          <Route path="/course-master/course-management" element={
            <ProtectedRoute allowedRoles={['CourseMaster', 'Admin']}>
              <CourseManagement />
            </ProtectedRoute>
          } />

          <Route path="/hod/*" element={
            <ProtectedRoute allowedRoles={['HOD', 'Admin']}>
              <HODDashboard />
            </ProtectedRoute>
          } />

          <Route path="/trainer/authoring" element={
            <ProtectedRoute allowedRoles={['Trainer', 'Admin']}>
              <TrainerCourseManagement />
            </ProtectedRoute>
          } />

          <Route path="/trainer/authoring/lesson/:lessonId" element={
            <ProtectedRoute allowedRoles={['Trainer', 'Admin']}>
              <LessonEditor />
            </ProtectedRoute>
          } />

          <Route path="/trainer/assessment/:assessmentId/author" element={
            <ProtectedRoute allowedRoles={['Trainer', 'Admin']}>
              <AssessmentAuthoring />
            </ProtectedRoute>
          } />

          <Route path="/trainer/*" element={
            <ProtectedRoute allowedRoles={['Trainer', 'Admin']}>
              <EnhancedTrainerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student/unit/:unitId/lesson/:lessonOrder" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <LessonViewer />
            </ProtectedRoute>
          } />

          <Route path="/student/assessment/:assessmentId" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <AssessmentSubmission />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
