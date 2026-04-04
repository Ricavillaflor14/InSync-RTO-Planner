import { useState, useEffect, useRef } from 'react'
import { supabase, UserProfile } from '../lib/supabaseClient'
import { formatDate } from '../lib/rtoCalculations'
import { BuddyFinderSkeleton, LoadingSpinner } from './LoadingSkeletons'
import { useToast } from '../contexts/ToastContext'

interface BuddyWithStatus extends UserProfile {
  status: 'in-office' | 'remote' | 'unknown';
  seat_booking?: {
    seat_name: string;
    start_time: string;
    end_time: string;
  };
}

interface BuddyFinderProps {
  selectedDate?: string;
  isCompact?: boolean;
}

const BuddyFinder = ({ selectedDate = formatDate(new Date()), isCompact = false }: BuddyFinderProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [buddies, setBuddies] = useState<BuddyWithStatus[]>([])
  const [filteredBuddies, setFilteredBuddies] = useState<BuddyWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [, setSearchFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { showToast } = useToast()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBuddies()
  }, [selectedDate])

  useEffect(() => {
    // Filter buddies based on search query
    if (searchQuery.trim() === '') {
      setFilteredBuddies(buddies)
    } else {
      const filtered = buddies.filter(buddy => 
        buddy.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buddy.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buddy.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (buddy as any).department?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBuddies(filtered)
    }
  }, [searchQuery, buddies])

  useEffect(() => {
    // Handle clicking outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchBuddies = async () => {
    try {
      setLoading(true)
      
      // Fetch all users with their calendar entries and seat bookings for the selected date
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', (await supabase.auth.getUser()).data.user?.id || '') // Exclude current user

      if (usersError) throw usersError

      // Fetch calendar entries for the date
      const { data: calendarEntries, error: calendarError } = await supabase
        .from('calendar_entries')
        .select('user_id, entry_type')
        .eq('entry_date', selectedDate)

      if (calendarError) throw calendarError

      // Fetch seat bookings for the date
      const { data: seatBookings, error: bookingsError } = await supabase
        .from('seat_bookings')
        .select(`
          user_id,
          start_time,
          end_time,
          seats!inner(seat_name)
        `)
        .eq('booking_date', selectedDate)
        .eq('is_cancelled', false)

      if (bookingsError) throw bookingsError

      // Combine the data to determine status
      const buddiesWithStatus: BuddyWithStatus[] = users.map(user => {
        const calendarEntry = calendarEntries?.find(entry => entry.user_id === user.id)
        const seatBooking = seatBookings?.find(booking => booking.user_id === user.id)

        let status: 'in-office' | 'remote' | 'unknown' = 'unknown'

        if (calendarEntry) {
          if (calendarEntry.entry_type === 'OFFICE') {
            status = 'in-office'
          } else if (['WFH', 'SL', 'WFA'].includes(calendarEntry.entry_type)) {
            status = 'remote'
          }
        } else if (seatBooking) {
          status = 'in-office'
        }

        return {
          ...user,
          status,
          seat_booking: seatBooking ? {
            seat_name: (seatBooking.seats as any).seat_name,
            start_time: seatBooking.start_time,
            end_time: seatBooking.end_time
          } : undefined
        }
      })

      setBuddies(buddiesWithStatus)
    } catch (error) {
      console.error('Error fetching buddies:', error)
      showToast('Failed to load buddy finder', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-office':
        return '🏢'
      case 'remote':
        return '🏠'
      default:
        return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-office':
        return 'text-green-600 bg-green-100'
      case 'remote':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-office':
        return 'In Office'
      case 'remote':
        return 'Remote'
      default:
        return 'Unknown'
    }
  }

  const sendMessage = (buddy: BuddyWithStatus) => {
    // In a real app, this would open a chat or email client
    showToast(`Opening chat with ${buddy.first_name || buddy.email}`, 'info')
  }

  if (isCompact) {
    return (
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Find colleagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setSearchFocused(true)
              setShowDropdown(true)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tr-orange focus:border-tr-orange outline-none"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
            {loading ? (
              <div className="p-4">
                <BuddyFinderSkeleton />
              </div>
            ) : filteredBuddies.length > 0 ? (
              filteredBuddies.slice(0, 10).map((buddy) => (
                <div
                  key={buddy.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-tr-orange text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {buddy.first_name?.[0] || buddy.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-tr-gray truncate">
                        {buddy.first_name} {buddy.last_name} 
                      </p>
                      <p className="text-xs text-gray-500 truncate">{buddy.email}</p>
                      {buddy.seat_booking && (
                        <p className="text-xs text-tr-orange">📍 {buddy.seat_booking.seat_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(buddy.status)}`}>
                      {getStatusIcon(buddy.status)} {getStatusText(buddy.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No colleagues found' : 'Start typing to search for colleagues'}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full version for dashboard
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-tr-gray mb-4 flex items-center">
        <span className="mr-2">👥</span>
        Buddy Finder
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({formatDate(new Date(selectedDate))})
        </span>
      </h3>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search colleagues by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tr-orange focus:border-tr-orange outline-none"
        />
        <div className="absolute left-3 top-3.5 text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute right-3 top-3.5">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <BuddyFinderSkeleton />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredBuddies.length > 0 ? (
            filteredBuddies.map((buddy) => (
              <div
                key={buddy.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-tr-orange text-white rounded-full flex items-center justify-center text-lg font-semibold">
                    {buddy.first_name?.[0] || buddy.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-tr-gray">
                      {buddy.first_name} {buddy.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{buddy.email}</p>
                    {(buddy as any).department && (
                      <p className="text-sm text-gray-500">{(buddy as any).department}</p>
                    )}
                    {buddy.seat_booking && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-tr-orange font-medium">
                          📍 {buddy.seat_booking.seat_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {buddy.seat_booking.start_time} - {buddy.seat_booking.end_time}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(buddy.status)}`}>
                    {getStatusIcon(buddy.status)} {getStatusText(buddy.status)}
                  </span>
                  <button
                    onClick={() => sendMessage(buddy)}
                    className="p-2 text-gray-400 hover:text-tr-orange transition-colors"
                    title="Send message"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No colleagues found matching your search' : 'No colleagues data available'}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredBuddies.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {filteredBuddies.filter(b => b.status === 'in-office').length} colleagues in office
            </span>
            <span>
              {filteredBuddies.filter(b => b.status === 'remote').length} working remotely
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BuddyFinder