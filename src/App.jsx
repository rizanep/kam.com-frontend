import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { JobProvider } from './context/JobContext'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ClientDashboard from './pages/Client/Dashboard'
import FreelancerDashboard from './pages/Freelancer/Dashboard'
import AdminDashboard from './pages/Admin/Dashboard'
import UserProfile from './pages/Client/Profile'
import ChangePassword from './components/ChangePassword'
import FreelancerProfile from './pages/Client/OutProfile'

// Job Portal Components
import JobsMainPage from './pages/Jobs/JobsMainPage'
import MyJobsPage from './pages/Jobs/MyJobsPage'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import PostJobPage from './pages/Jobs/PostJobPage'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.some(role => 
    user.account_types?.includes(role) || user.user_type === role
  )) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check user roles and redirect accordingly
  if (user.account_types?.includes('admin') || user.user_type === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.account_types?.includes('client') || user.user_type === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  } else if (user.account_types?.includes('freelancer') || user.user_type === 'freelancer') {
    return <Navigate to="/freelancer/dashboard" replace />;
  } else {
    // Default to jobs page if no specific role
    return <Navigate to="/jobs" replace />;
  }
};

// Unauthorized Page Component
const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Main App Routes Component
const AppRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Dashboard Redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Job Portal Routes - Available to all authenticated users */}
          <Route 
            path="/jobs/*" 
            element={
              <ProtectedRoute>
                <JobProvider>
                  <JobsMainPage />
                </JobProvider>
              </ProtectedRoute>
            } 
          />

          {/* Client Routes */}
          <Route 
            path="/client/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Fixed: Add dedicated route for client my-jobs */}
          <Route 
            path="/client/my-jobs" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <JobProvider>
                  <MyJobsPage 
                    onJobClick={(jobId) => window.location.href = `/jobs?jobId=${jobId}`}
                    onPostJob={() => window.location.href = '/freelancer/post-jobs'}
                  />
                </JobProvider>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/client/profile" 
            element={
              <ProtectedRoute allowedRoles={['client', 'freelancer', 'admin']}>
                <UserProfile />
              </ProtectedRoute>
            } 
          />

          {/* Freelancer Routes */}
          <Route 
            path="/freelancer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <FreelancerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/browse-jobs" 
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <JobProvider>
                  <JobsMainPage />
                </JobProvider>
              </ProtectedRoute>
            } 
          />
        
          {/* Post Job Route */}
          <Route 
            path="/freelancer/post-jobs" 
            element={
              <ProtectedRoute allowedRoles={['client', 'freelancer']}>
                <JobProvider>
                  <PostJobPage 
                    onBack={() => window.history.back()}
                    onJobPosted={(job) => {
                      console.log('Job posted:', job);
                      // Navigate to client my-jobs if user is a client
                      window.location.href = '/client/my-jobs';
                    }}
                  />
                </JobProvider>
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Shared Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/resetpass" 
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/profile/:userId" 
            element={
              <ProtectedRoute>
                <FreelancerProfile />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                  <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                  <a 
                    href="/"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}