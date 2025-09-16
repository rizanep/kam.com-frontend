import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu as MenuIcon,
  X as XIcon,
  Bell as BellIcon,
  MessageSquare as MessageSquareIcon,
  User as UserIcon,
  LogOut,
  Briefcase,
  Search,
  Plus,
  FileText,
  Bookmark,
  Settings,
  ChevronDown,
  Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()

  const isAuthenticated = !!user
  const userRole = user?.user_type
  const accountTypes = user?.account_types || []
  
  // Check if user has multiple roles
  const isClient = accountTypes.includes('client') || userRole === 'client'
  const isFreelancer = accountTypes.includes('freelancer') || userRole === 'freelancer'
  const isAdmin = accountTypes.includes('admin') || userRole === 'admin' || user?.is_staff

  // Resolve profile route dynamically
  const profileRoute = '/profile'

  // Navigation items based on user roles
  const getNavigationItems = () => {
    if (!isAuthenticated) return []

    const items = []

    // Jobs Portal - Always available for authenticated users
    items.push({
      to: '/jobs',
      label: 'Browse Jobs',
      icon: Search,
      active: location.pathname.startsWith('/jobs')
    })

    // Client-specific items
    if (isClient) {
      items.push(
        {
          to: '/client/dashboard',
          label: 'Client Dashboard',
          icon: Briefcase,
          active: location.pathname.includes('/client/dashboard')
        },
        {
          to: '/freelancer/post-jobs',
          label: 'Post Job',
          icon: Plus,
          active: location.pathname.includes('/post-job')
        },
    {
  to: '/jobs?view=my-jobs',  // Changed from '/client/my-jobs'
  label: 'My Jobs',
  icon: FileText,
  active: location.pathname.includes('/jobs') && new URLSearchParams(location.search).get('view') === 'my-jobs'
}
      )
    }

    // Freelancer-specific items
    if (isFreelancer) {
      items.push(
        {
          to: '/freelancer/dashboard',
          label: 'Freelancer Dashboard',
          icon: Briefcase,
          active: location.pathname.includes('/freelancer/dashboard')
        },
        {
          to: '/jobs?view=saved',
          label: 'Saved Jobs',
          icon: Bookmark,
          active: location.pathname.includes('/saved')
        }
      )
    }

    // Admin-specific items
    if (isAdmin) {
      items.push({
        to: '/admin/dashboard',
        label: 'Admin Panel',
        icon: Shield,
        active: location.pathname.includes('/admin/dashboard')
      })
    }

    return items
  }

  const navigationItems = getNavigationItems()

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    setShowUserMenu(false)
  }

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.username || user?.email || 'User'
  }

  const getUserRoleDisplay = () => {
    if (isClient && isFreelancer) return 'Client & Freelancer'
    if (isAdmin) return 'Administrator'
    if (isClient) return 'Client'
    if (isFreelancer) return 'Freelancer'
    return 'Member'
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                Kam.<span className="text-green-500">Com</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {/* Main Navigation Items */}
                {navigationItems.slice(0, 4).map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.active
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}

                {/* More menu for additional items */}
                {navigationItems.length > 4 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      More
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        {navigationItems.slice(4).map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                item.active
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Menu (Desktop) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-3">
              {/* Notifications */}
              <Link
                to="/notifications"
                className="p-2 rounded-full text-gray-500 hover:text-blue-600 focus:outline-none relative transition-colors"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Link>

              {/* Messages */}
              <Link
                to="/messages"
                className="p-2 rounded-full text-gray-500 hover:text-blue-600 focus:outline-none relative transition-colors"
              >
                <MessageSquareIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Link>

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 p-1 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture.startsWith('http') 
                          ? user.profile_picture 
                          : `http://localhost:8000${user.profile_picture}`}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getUserRoleDisplay()}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-blue-600 mt-1">{getUserRoleDisplay()}</p>
                    </div>
                    
                    <Link
                      to={profileRoute}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    
                    <Link
                      to="/user/resetpass"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    
                    <div className="border-t border-gray-100"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition-colors"
            >
              {isOpen ? (
                <XIcon className="block h-6 w-6" />
              ) : (
                <MenuIcon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        item.active
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}

                {/* Mobile User Actions */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <Link
                    to="/notifications"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <BellIcon className="h-5 w-5" />
                    Notifications
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                  </Link>
                  
                  <Link
                    to="/messages"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <MessageSquareIcon className="h-5 w-5" />
                    Messages
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                  </Link>
                  
                  <Link
                    to={profileRoute}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserIcon className="h-5 w-5" />
                    Profile
                  </Link>
                  
                  <Link
                    to="/user/resetpass"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </div>

                {/* User info for mobile */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center px-3 py-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture.startsWith('http') 
                            ? user.profile_picture 
                            : `http://localhost:8000${user.profile_picture}`}
                          alt="Profile"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-700">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs text-blue-600">{getUserRoleDisplay()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar