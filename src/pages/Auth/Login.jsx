import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeIcon, EyeOffIcon, ShieldCheckIcon, KeyIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import MFASetupModal from './MFASetupModal'
import MFAVerificationModal from './MFAVerificationModal'

const Login = () => {
  const { login, error, clearError } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // MFA states
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false)
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [showMfaVerification, setShowMfaVerification] = useState(false)
  const [tempCredentials, setTempCredentials] = useState(null)

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  clearError()

  try {
    await login(email, password)
    // navigation happens inside AuthContext after login
  } catch (err) {
    // Check if it's an MFA-related response
    if (err.message === 'MFA Required' && err.response?.data?.mfa_required) {
      setMfaRequired(true)
      setMfaSetupRequired(err.response.data.mfa_setup_required)
      setTempCredentials({ email, password })
      
      if (err.response.data.mfa_setup_required) {
        setShowMfaSetup(true)
      } else {
        setShowMfaVerification(true)
      }
    } else {
      console.error('Login failed:', err.message)
    }
  } finally {
    setLoading(false)
  }
}

  const handleMfaVerificationSuccess = () => {
    setShowMfaVerification(false)
    setMfaRequired(false)
    setTempCredentials(null)
    // Navigation will be handled by the verification modal
  }

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false)
    setMfaSetupRequired(false)
    setShowMfaVerification(true) // Now show verification after setup
  }

  const handleResetMfaFlow = () => {
    setMfaRequired(false)
    setMfaSetupRequired(false)
    setShowMfaSetup(false)
    setShowMfaVerification(false)
    setTempCredentials(null)
    clearError()
  }

  // Helper function to get primary account type for navigation
  const getPrimaryAccountType = (accountTypes) => {
    if (!Array.isArray(accountTypes) || accountTypes.length === 0) {
      return 'freelancer'; // default fallback
    }
    return accountTypes[0]; // Use first account type as primary
  }

  // Google login success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    clearError()
    
    try {
      console.log("Google response:", credentialResponse)

      // Send the credential to your backend - no account_types needed for login
      const res = await axios.post(
        'http://localhost:8000/api/auth/google/',
        { credential: credentialResponse.credential },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('JWT Tokens:', res.data)

      // Save JWT tokens
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)

      // Check for redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      console.log(res.data.user)
      
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin')
        window.location.href = redirectPath
      } else {
        // Default redirect based on user's account types (use primary account type)
        const primaryAccountType = getPrimaryAccountType(res.data.user.account_types)
        
        if (primaryAccountType === 'client') {
          window.location.href = '/client/dashboard'
        } else if (primaryAccountType === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/freelancer/dashboard'
        }
      }
    } catch (err) {
      console.error('Google login failed:', err)
      const errorMessage = err.response?.data?.error || 'Google login failed. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.log('Google Login Failed')
    alert('Google login failed. Please try again.')
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to Kam.Com
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Security Notice for Admin */}
        {mfaRequired && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Enhanced Security Required
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {mfaSetupRequired 
                    ? 'Please set up two-factor authentication to secure your admin account.'
                    : 'Please enter your two-factor authentication code to continue.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mfaRequired}
                className="shadow-sm mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Email address"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={mfaRequired}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={mfaRequired}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={mfaRequired}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || mfaRequired}
              className="shadow-sm group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white 
              bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : mfaRequired ? 'Awaiting Authentication...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* MFA Action Buttons */}
        {mfaRequired && (
          <div className="space-y-3">
            {mfaSetupRequired ? (
              <button
                onClick={() => setShowMfaSetup(true)}
                className="w-full flex justify-center items-center py-2 px-4 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                Set Up Two-Factor Authentication
              </button>
            ) : (
              <button
                onClick={() => setShowMfaVerification(true)}
                className="w-full flex justify-center items-center py-2 px-4 border border-green-300 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Enter Authentication Code
              </button>
            )}
            
            <button
              onClick={handleResetMfaFlow}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            >
              Try Different Login Method
            </button>
          </div>
        )}

        {/* Only show Google login if MFA is not required */}
        {!mfaRequired && (
          <>
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="rectangular"
                size="large"
                width="300"
              />
            </div>
          </>
        )}
      </div>

      {/* MFA Modals */}
      {showMfaSetup && (
  <MFASetupModal
    isOpen={showMfaSetup}
    onClose={() => setShowMfaSetup(false)}
    onComplete={handleMfaSetupComplete}
    credentials={tempCredentials} // Make sure this contains email and password
  />
)}

      {showMfaVerification && (
        <MFAVerificationModal
          isOpen={showMfaVerification}
          onClose={() => setShowMfaVerification(false)}
          onSuccess={handleMfaVerificationSuccess}
          credentials={tempCredentials}
        />
      )}
    </div>
  )
}

export default Login