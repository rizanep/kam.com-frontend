import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu as MenuIcon,
  X as XIcon,
  Bell as BellIcon,
  MessageSquare as MessageSquareIcon,
  User as UserIcon,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isAuthenticated = !!user
  const userRole = user?.user_type

  // Resolve profile route dynamically
  const profileRoute ='/client/profile'
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                Kam.<span className="text-green-500">Com </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            ) : userRole === 'client' ? (
              <>
                <Link
                  to="/client/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/client/dashboard')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/client/post-job"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/client/post-job')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Post a Job
                </Link>
                <Link
                  to="/client/my-jobs"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/client/my-jobs')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  My Jobs
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/freelancer/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/freelancer/dashboard')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/freelancer/browse-jobs"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/freelancer/browse-jobs')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Find Jobs
                </Link>
                <Link
                  to="/freelancer/my-bids"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/freelancer/my-bids')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  My Bids
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Log out
                </button>
              </>
            )}
          </div>

          {/* User Menu (Desktop) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center">
              <Link
                to="/notifications"
                className="p-1 rounded-full text-gray-500 hover:text-blue-600 focus:outline-none relative"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Link>

              <Link
                to="/messages"
                className="p-1 ml-3 rounded-full text-gray-500 hover:text-blue-600 focus:outline-none relative"
              >
                <MessageSquareIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Link>

              <div className="ml-3 relative">
                <Link
                  to={profileRoute}
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {user?.email}
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {userRole === 'client' ? (
                  <>
                    <Link
                      to="/client/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/client/post-job"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Post a Job
                    </Link>
                    <Link
                      to="/client/my-jobs"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      My Jobs
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/freelancer/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/freelancer/browse-jobs"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Find Jobs
                    </Link>
                    <Link
                      to="/freelancer/my-bids"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      My Bids
                    </Link>
                  </>
                )}
                <Link
                  to="/notifications"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Notifications
                </Link>
                <Link
                  to="/messages"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to={profileRoute}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100"
                >
                  Log out
                </button>
              </>
            )}

            {/* User info for mobile */}
            {isAuthenticated && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center px-3">
                  <Link
                    to={profileRoute}
                    className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"
                  >
                    <UserIcon className="h-6 w-6" />
                  </Link>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
