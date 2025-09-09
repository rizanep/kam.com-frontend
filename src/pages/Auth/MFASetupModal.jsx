import React, { useState, useEffect } from 'react'
import { X, Shield, Copy, CheckCircle, AlertTriangle, Smartphone, Download } from 'lucide-react'
import { useApi } from '../../context/AuthContext'

const MFASetupModal = ({ isOpen, onClose, onComplete, credentials }) => {
  const api = useApi()
  
  const [step, setStep] = useState(1) // 1: Instructions, 2: QR Code, 3: Verification, 4: Backup Codes
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)

  useEffect(() => {
    if (isOpen && step === 2) {
      setupMFA()
    }
  }, [isOpen, step])

  // In MFASetupModal.jsx - Update the setupMFA function to send credentials



  const setupMFA = async () => {
  setLoading(true)
  setError('')

  try {
    const response = await api.post('/auth/mfa/setup/', {
      email: credentials?.email,
      password: credentials?.password,
    })

    console.log("MFA setup response:", response.data)
    setQrCode(response.data.qr_code)
    setSecret(response.data.secret)
  } catch (err) {
    console.error("Setup MFA error:", err.response?.data || err.message)
    setError(err.response?.data?.error || 'Setup failed')
  } finally {
    setLoading(false)
  }
}

  const verifySetup = async () => {
  if (!verificationCode || verificationCode.length !== 6) {
    setError('Please enter a valid 6-digit code')
    return
  }

  setLoading(true)
  setError('')

  try {
    const response = await api.post('/auth/mfa/verify-setup/', {
      token: verificationCode,
      email: credentials?.email,
      password: credentials?.password,
    })

    console.log("MFA verify response:", response.data)
    setBackupCodes(response.data.backup_codes)
    setStep(4)
  } catch (err) {
    console.error("Verify MFA error:", err.response?.data || err.message)
    setError(err.response?.data?.error || 'Invalid verification code. Please try again.')
  } finally {
    setLoading(false)
  }
}
  // ... rest of your component

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else if (type === 'backup') {
        setCopiedBackupCodes(true)
        setTimeout(() => setCopiedBackupCodes(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mfa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Set Up Two-Factor Authentication
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
          {/* Step 1: Instructions */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Smartphone className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Secure Your Admin Account
                </h3>
                <p className="text-gray-600">
                  Two-factor authentication adds an extra layer of security to your admin account.
                  You'll need an authenticator app to get started.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Recommended Apps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• 1Password</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <strong>Step 1:</strong> Download and install an authenticator app on your smartphone.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Step 2:</strong> We'll show you a QR code to scan with your app.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Step 3:</strong> Enter the verification code from your app.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue Setup
              </button>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Scan QR Code
                </h3>
                <p className="text-gray-600 mb-4">
                  Open your authenticator app and scan this QR code:
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {qrCode && (
                    <div className="flex justify-center">
                      <img 
                        src={qrCode} 
                        alt="QR Code for MFA setup" 
                        className="border rounded-lg"
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Can't scan? Enter this code manually:
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white px-3 py-2 border rounded text-sm font-mono">
                        {secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(secret, 'secret')}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Copy secret"
                      >
                        {copiedSecret ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    I've Added the Account
                  </button>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Verify Setup
                </h3>
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit code from your authenticator app:
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={verifySetup}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable MFA'}
                </button>
                
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Back to QR Code
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Backup Codes */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  MFA Successfully Enabled!
                </h3>
                <p className="text-gray-600 mb-4">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>Each backup code can only be used once. Store them securely and don't share them with anyone.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Backup Codes</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {copiedBackupCodes ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedBackupCodes ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadBackupCodes}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="bg-white px-2 py-1 rounded text-sm font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MFASetupModal