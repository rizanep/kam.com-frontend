import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { JobProvider } from './context/JobContext'
import { BidsProvider } from './context/BidsContext'
import { useLocation } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
import PostJobPage from './pages/Jobs/PostJobPage'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import BidsManagementDashboard from './pages/Client/BidsManagmentDashboard'
import BidsDashboard from './pages/Freelancer/BidsDashboard'
import SavedJobsPage from './pages/Jobs/SavedJobsPage'
import MessagingSystem from './pages/Messages/MessagingSystem'
import NotificationsPage from './pages/NotificationsPage'
import AIChatWidget from './pages/AIChatWidget'
import AcceptedBidsPaymentPage from './pages/Client/AcceptedBidsPaymentPage'
import FreelancerAcceptedBidsPage from './pages/Freelancer/AcceptedBidsPage'
import MessagesPage from './pages/Messages/MessagesPage'
import { Toaster } from './components/ui/sonner'

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
  const location = useLocation();

  // Routes where footer should be hidden
  const noFooterRoutes = ['/login', '/register', '/messages', '/notifications'];

  const showFooter = !noFooterRoutes.includes(location.pathname);
  
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
              <ProtectedRoute  >
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
          
          <Route 
            path="/client/my-jobs" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <JobProvider>
                  <MyJobsPage 
                    onJobClick={(jobId) => window.location.href = `/jobs?jobId=${jobId}`}
                    onPostJob={() => window.location.href = '/jobs/post'}
                  />
                </JobProvider>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client/accepted" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
               
                  <AcceptedBidsPaymentPage/>
           
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/freelancer/accepted" 
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
               
<FreelancerAcceptedBidsPage/>           
              </ProtectedRoute>
            } 
          />

          {/* Client Bids Management */}
          <Route 
            path="/client/proposals" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <JobProvider>
                <BidsProvider>
                  <BidsManagementDashboard />
                </BidsProvider>
                </JobProvider>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client/saved-jobs" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <JobProvider>
                <SavedJobsPage/>
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

          {/* Freelancer Bids Dashboard */}
          <Route 
            path="/freelancer/proposals" 
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <BidsProvider>
                  <BidsDashboard />
                </BidsProvider>
              </ProtectedRoute>
            } 
          />
        
          {/* Post Job Route */}
          <Route 
            path="/jobs/post" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <JobProvider>
                  <PostJobPage 
                    onBack={() => window.history.back()}
                    onJobPosted={(job) => {
                      console.log('Job posted:', job);
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
            path="/messages" 
            element={
              <ProtectedRoute>
                <MessagesPage/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
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
       {/* Conditionally render footer */}
      {showFooter && <Footer />}
      {showFooter &&< AIChatWidget />}
    <Toaster
        position="bottom-center" 
        closeButton    // 👆 moves it up
        toastOptions={{
          style: {
            background: "white", // 💙 blue background
            color: "#007BFF",        // white text
            borderRadius: "8px",
            fontSize: "15px",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between", // ensures content + close button align
            alignItems: "center",
            gap: "10px",
          },
        }}
             // optional: makes toasts vibrant
           // adds a small close icon
      />
      {/* Toast Container with custom styles for notifications */}
      {/* <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="custom-toast-container"
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        style={{
          fontSize: '14px',
          zIndex: 9999,
        }}
        limit={5} // Allow up to 5 toasts at a time
      />
      
      {/* Custom CSS for notification toasts */}
      
    </div>
  );
};

// Main App Component with nested providers
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}