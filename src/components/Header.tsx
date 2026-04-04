import { signOut } from '../lib/supabaseClient'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()
  
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-gradient-to-r from-white to-gray-50 border-b-3 border-tr-orange shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Co-Branded Logo Section */}
          <div className="flex items-center space-x-8">
            {/* InSync Logo */}
            <div className="flex items-center">
              <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#FA6400', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#FF7A1A', stopOpacity: 1}} />
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

            {/* Brand Divider */}
            <div className="w-0.5 h-10 bg-gradient-to-b from-transparent via-tr-orange to-transparent opacity-60"></div>

            {/* Thomson Reuters Logo */}
            <div className="flex items-center">
              <img src="/assets/logos/thomson-reuters-logo.png" alt="Thomson Reuters" className="h-8 opacity-90" />
            </div>
          </div>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-tr-orange text-white' : 'text-tr-gray hover:text-tr-orange'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/calendar" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/calendar') ? 'bg-tr-orange text-white' : 'text-tr-gray hover:text-tr-orange'
                }`}
              >
                My Calendar
              </Link>
              <Link 
                to="/seat-map" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/seat-map') ? 'bg-tr-orange text-white' : 'text-tr-gray hover:text-tr-orange'
                }`}
              >
                Seat Map
              </Link>
              <Link 
                to="/rto-calculator" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/rto-calculator') ? 'bg-tr-orange text-white' : 'text-tr-gray hover:text-tr-orange'
                }`}
              >
                RTO Calculator
              </Link>
              <Link 
                to="/reports" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/reports') ? 'bg-tr-orange text-white' : 'text-tr-gray hover:text-tr-orange'
                }`}
              >
                Reports
              </Link>
            </nav>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header