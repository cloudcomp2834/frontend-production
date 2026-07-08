import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage';
import { AdminAddDoctorPage } from './pages/admin/AdminAddDoctorPage';
import { AdminDoctorSchedulePage } from './pages/admin/AdminDoctorSchedulePage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientBookingPage } from './pages/patient/PatientBookingPage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientPaymentPage } from './pages/patient/PatientPaymentPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';

function HomePage() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    const dashboardMap = {
      Admin: '/admin',
      Doctor: '/doctor',
      Patient: '/patient',
    };
    return <Navigate to={dashboardMap[role]} replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDoctorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors/new"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminAddDoctorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors/:doctorId/schedule"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDoctorSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Doctor routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <DoctorSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['Doctor']}>
                  <DoctorAppointmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Patient routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book"
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientBookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments/:appointmentId/pay"
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientPaymentPage />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
