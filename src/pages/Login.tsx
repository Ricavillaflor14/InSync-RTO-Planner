import { useState } from 'react'
import { supabase, validateEmailDomain } from '../lib/supabaseClient'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    // Validate Thomson Reuters email domain
    if (!validateEmailDomain(email)) {
      setError('Access is restricted to @thomsonreuters.com email addresses only.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (error.message.includes('Invalid API key') || error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        setError('Authentication service temporarily unavailable. Please use Demo Mode below to test the application.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.')
      } else {
        setError(error.message || 'An error occurred during authentication. Try Demo Mode for testing.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-tr-orange to-orange-600 text-white flex-col justify-center px-12">
        <div className="mb-8">
          <svg width="150" height="50" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className="scale-125">
            <g>
              <circle cx="15" cy="20" r="8" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.8"/>
              <circle cx="25" cy="20" r="8" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
              <circle cx="20" cy="20" r="3" fill="#FFFFFF"/>
            </g>
            <text x="40" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF">In</text>
            <text x="55" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF">Sync</text>
            <text x="40" y="28" fontFamily="Arial, sans-serif" fontSize="8" fill="#FFFFFF" opacity="0.9">RTO PLANNER</text>
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-6">
          Welcome to InSync
        </h1>
        <p className="text-xl mb-8 text-orange-100">
          Thomson Reuters' Return to Office Planning Platform
        </p>
        <ul className="space-y-3 text-orange-100">
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            Smart seat mapping and allocation
          </li>
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            Automated RTO compliance tracking
          </li>
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            Real-time reporting and analytics
          </li>
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            Seamless team coordination
          </li>
        </ul>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* InSync Logo */}
            <div className="mx-auto h-16 mb-6 flex justify-center">
              <svg width="120" height="64" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className="scale-150">
                <defs>
                  <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:"#FA6400", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#FF7A1A", stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <g>
                  <circle cx="15" cy="20" r="8" fill="none" stroke="#FA6400" strokeWidth="2" opacity="0.7"/>
                  <circle cx="25" cy="20" r="8" fill="none" stroke="#FA6400" strokeWidth="2"/>
                  <circle cx="20" cy="20" r="3" fill="#FA6400"/>
                </g>
                <text x="40" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#404040">In</text>
                <text x="55" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#FA6400">Sync</text>
                <text x="40" y="28" fontFamily="Arial, sans-serif" fontSize="8" fill="#404040" opacity="0.8">RTO PLANNER</text>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-tr-gray">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access restricted to @thomsonreuters.com email addresses
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-tr-gray mb-2">
                Thomson Reuters Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@thomsonreuters.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-tr-gray mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                }}
                className="text-tr-orange hover:text-orange-600 text-sm font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Demo Mode - Always visible for testing */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-3">
                For testing purposes:
              </p>
              <button
                type="button"
                onClick={() => {
                  console.log('Demo mode clicked - navigating to dashboard')
                  window.location.href = '/InSync-RTO-Planner/dashboard'
                }}
                className="w-full bg-tr-orange hover:bg-orange-600 text-white py-3 px-4 rounded-md text-sm font-medium transition-colors"
              >
                🚀 DEMO MODE - Access Dashboard
              </button>
              <p className="text-xs text-gray-500 mt-2">
                (Bypasses authentication for testing - Click this to access the app)
              </p>
            </div>
          </form>

          <div className="text-center text-xs text-gray-500 mt-8">
            <p>© 2026 Thomson Reuters. All rights reserved.</p>
            <p>Secure authentication with role-based access control</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login