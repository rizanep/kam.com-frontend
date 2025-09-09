import React, { useState } from 'react'
import { X, Shield, AlertTriangle, Smartphone, Key } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MFAVerificationModal = ({ isOpen, onClose, onSuccess, credentials }) => {
  const { api } = useAuth()
  
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleVerification = async () => {
  if (!verificationCode || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)) {
    setError(useBackupCode ? 'Please enter a valid 8-character backup code' : 'Please enter a valid 6-digit code')
    return
  }

  setLoading(true)
  setError('')
  
  try {
    const response = await api.post('/auth/mfa/verify-setup/', {
      email: credentials.email,
      password: credentials.password,
      token: verificationCode
    })

    // ✅ only store tokens if they exist
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
    }

    // ✅ safe user load
    const user = response.data.user || JSON.parse(localStorage.getItem('user') || '{}')
    const primaryAccountType = user.account_types?.[0] || 'freelancer'

    onSuccess()

    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin')
      window.location.href = redirectPath
    } else {
      if (primaryAccountType === 'client') {
        window.location.href = '/client/dashboard'
      } else if (primaryAccountType === 'admin') {
        window.location.href = '/admin/dashboard'
      } else {
        window.location.href = '/freelancer/dashboard'
      }
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Invalid authentication code. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const handleInputChange = (e) => {
    const value = e.target.value
    if (useBackupCode) {
      // Allow alphanumeric for backup codes
      setVerificationCode(value.replace(/[^A-Z0-9]/gi, '').toUpperCase())
    } else {
      // Only digits for TOTP codes
      setVerificationCode(value.replace(/\D/g, ''))
    }
  }

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode)
    setVerificationCode('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Two-Factor Authentication
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              {useBackupCode ? (
                <Key className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              ) : (
                <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {useBackupCode ? 'Enter Backup Code' : 'Enter Authentication Code'}
              </h3>
              <p className="text-gray-600">
                {useBackupCode 
                  ? 'Enter one of your saved backup codes:'
                  : 'Open your authenticator app and enter the 6-digit code:'
                }
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={useBackupCode ? "8" : "6"}
                value={verificationCode}
                onChange={handleInputChange}
                className="w-full text-center text-2xl font-mono px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {useBackupCode ? '8-character backup code' : '6-digit authentication code'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleVerification}
                disabled={loading || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify and Sign In'}
              </button>

              <div className="text-center">
                <button
                  onClick={toggleBackupCode}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {useBackupCode 
                    ? 'Use authenticator app instead' 
                    : 'Use backup code instead'
                  }
                </button>
              </div>
            </div>

            {/* Help text */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {useBackupCode ? 'About Backup Codes:' : 'Trouble with your authenticator?'}
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                {useBackupCode ? (
                  <>
                    <p>• Backup codes are 8-character codes you saved during MFA setup</p>
                    <p>• Each code can only be used once</p>
                    <p>• They're meant for emergency access when you don't have your phone</p>
                  </>
                ) : (
                  <>
                    <p>• Make sure your device's time is correct</p>
                    <p>• The code refreshes every 30 seconds</p>
                    <p>• If you're having trouble, try using a backup code</p>
                  </>
                )}
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel and try different login method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MFAVerificationModal