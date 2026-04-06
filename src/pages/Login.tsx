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
      if (error.message.includes('Invalid API key') || error.message.includes('Failed to fetch')) {
        setError('Application configuration error. Please ensure Supabase credentials are properly set in GitHub Secrets.')
      } else {
        setError(error.message || 'An error occurred during authentication')
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
            <img 
              src="/InSync-RTO-Planner/assets/logos/insync-logo.svg" 
              alt="InSync RTO Planner" 
              className="mx-auto h-16 mb-6"
            />
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
              
              {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/InSync-RTO-Planner/dashboard'}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Demo Mode (Testing without Supabase)
                  </button>
                </div>
              )}
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