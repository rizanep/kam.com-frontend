import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ClientDashboard from './pages/Client/Dashboard'
import FreelancerDashboard from './pages/Freelancer/Dashboard'
import AdminDashboard from './pages/Admin/Dashboard'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import UserProfile from './pages/Client/Profile'
import ChangePassword from './components/ChangePassword'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/profile" element={<UserProfile/>} />
          <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path='/user/resetpass' element={<ChangePassword />}/>
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
