import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, getUserProfile, UserProfile } from '../lib/supabaseClient'
import { formatDate, parseDate, getDatesBetween } from '../lib/rtoCalculations'

interface Seat {
  id: string;
  seat_name: string;
  floor: string;
  section: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface SeatBooking {
  id: string;
  user_id: string;
  seat_id: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface BookingModal {
  isOpen: boolean;
  seat: Seat | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isMultiDay: boolean;
}

interface SeatManagementModal {
  isOpen: boolean;
  seatName: string;
  floor: string;
  section: string;
}

const SeatMap = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [bookings, setBookings] = useState<SeatBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  
  // Calculate maximum booking date (2 weeks from today)
  const getMaxBookingDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 14) // 2 weeks = 14 days
    return formatDate(maxDate)
  }
  const [bookingModal, setBookingModal] = useState<BookingModal>({
    isOpen: false,
    seat: null,
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    isMultiDay: false
  })
  const [seatManagementModal, setSeatManagementModal] = useState<SeatManagementModal>({
    isOpen: false,
    seatName: '',
    floor: '10F',
    section: 'Section A'
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setUserProfile(profile)
          await fetchSeats()
          await fetchBookings()
        } else {
          // Demo mode - load mock seats
          setSeats([
            { id: '1', seat_name: 'A-101', floor: '10F', section: 'Section A', is_available: true, created_at: '', updated_at: '' },
            { id: '2', seat_name: 'A-102', floor: '10F', section: 'Section A', is_available: true, created_at: '', updated_at: '' },
            { id: '3', seat_name: 'A-103', floor: '10F', section: 'Section A', is_available: true, created_at: '', updated_at: '' },
            { id: '4', seat_name: 'A-104', floor: '10F', section: 'Section A', is_available: false, created_at: '', updated_at: '' },
            { id: '5', seat_name: 'B-101', floor: '10F', section: 'Section B', is_available: true, created_at: '', updated_at: '' },
            { id: '6', seat_name: 'B-102', floor: '10F', section: 'Section B', is_available: true, created_at: '', updated_at: '' },
            { id: '7', seat_name: 'B-103', floor: '10F', section: 'Section B', is_available: true, created_at: '', updated_at: '' },
            { id: '8', seat_name: 'B-104', floor: '10F', section: 'Section B', is_available: false, created_at: '', updated_at: '' },
            { id: '9', seat_name: 'C-101', floor: '11F', section: 'Section C', is_available: true, created_at: '', updated_at: '' },
            { id: '10', seat_name: 'C-102', floor: '11F', section: 'Section C', is_available: true, created_at: '', updated_at: '' },
            { id: '11', seat_name: 'C-103', floor: '11F', section: 'Section C', is_available: true, created_at: '', updated_at: '' },
            { id: '12', seat_name: 'C-104', floor: '11F', section: 'Section C', is_available: true, created_at: '', updated_at: '' },
          ])
        }
      } catch (error) {
        console.error('Error initializing seat map:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [selectedDate])

  const fetchSeats = async () => {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .order('seat_name')

    if (error) {
      console.error('Error fetching seats:', error)
    } else {
      setSeats(data || [])
    }
  }

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('seat_bookings')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('booking_date', selectedDate)
      .eq('is_cancelled', false)

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
  }

  const groupSeatsBySection = () => {
    const sections: { [key: string]: Seat[] } = {}
    seats.forEach(seat => {
      if (!sections[seat.section]) {
        sections[seat.section] = []
      }
      sections[seat.section].push(seat)
    })
    return sections
  }

  const getSeatBooking = (seatId: string): SeatBooking | undefined => {
    return bookings.find(booking => booking.seat_id === seatId)
  }

  const checkBookingConflicts = async (seatId: string, startDate: string, endDate: string): Promise<SeatBooking[]> => {
    const dates = getDatesBetween(parseDate(startDate), parseDate(endDate))
    const dateStrings = dates.map(date => formatDate(date))

    const { data, error } = await supabase
      .from('seat_bookings')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('seat_id', seatId)
      .in('booking_date', dateStrings)
      .eq('is_cancelled', false)

    if (error) {
      console.error('Error checking conflicts:', error)
      return []
    }

    return data || []
  }

  const handleSeatClick = (seat: Seat) => {
    if (!seat.is_available) return

    setBookingModal({
      ...bookingModal,
      isOpen: true,
      seat,
      startDate: selectedDate,
      endDate: selectedDate
    })
  }

  const generateCalendarEvent = () => {
    if (!bookingModal.seat || !userProfile) return ''
    
    const startDate = bookingModal.startDate
    const endDate = bookingModal.isMultiDay ? bookingModal.endDate : startDate
    const startDateTime = `${startDate}T${bookingModal.startTime}:00`
    const endDateTime = `${endDate}T${bookingModal.endTime}:00`
    
    const title = encodeURIComponent(`Office Seat: ${bookingModal.seat.seat_name}`)
    const details = encodeURIComponent(`Seat booking for ${bookingModal.seat.seat_name} in ${bookingModal.seat.section}`)
    const location = encodeURIComponent(`${bookingModal.seat.seat_name}, ${bookingModal.seat.floor}, ${bookingModal.seat.section}`)
    
    // Convert to UTC format for calendar
    const start = new Date(startDateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const end = new Date(endDateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`
  }

  const handleBookSeat = async () => {
    if (!bookingModal.seat) return

    // Demo mode - just simulate booking
    if (!userProfile) {
      alert(`✅ Demo: Seat ${bookingModal.seat.seat_name} booked successfully!`)
      setBookingModal({ ...bookingModal, isOpen: false })
      return
    }

    try {
      const startDate = bookingModal.startDate
      const endDate = bookingModal.isMultiDay ? bookingModal.endDate : startDate
      
      // Check for conflicts
      const conflicts = await checkBookingConflicts(bookingModal.seat.id, startDate, endDate)
      if (conflicts.length > 0) {
        alert('This seat is already booked for some of the selected dates. Please choose different dates.')
        return
      }

      // Generate all dates for booking
      const dates = getDatesBetween(parseDate(startDate), parseDate(endDate))
      const bookings = dates.map(date => ({
        user_id: userProfile.id,
        seat_id: bookingModal.seat!.id,
        booking_date: formatDate(date),
        start_time: bookingModal.startTime,
        end_time: bookingModal.endTime
      }))

      // Insert all bookings
      const { error } = await supabase
        .from('seat_bookings')
        .insert(bookings)

      if (error) throw error

      // Refresh data
      await fetchBookings()
      setBookingModal({ ...bookingModal, isOpen: false })
      
      alert(`Successfully booked ${bookingModal.seat.seat_name} for ${dates.length} day(s)!`)
    } catch (error) {
      console.error('Error booking seat:', error)
      alert('Failed to book seat. Please try again.')
    }
  }

  const handleAddSeat = async () => {
    if (!userProfile || userProfile.role !== 'Manager' && userProfile.role !== 'Admin') return

    try {
      const { error } = await supabase
        .from('seats')
        .insert({
          seat_name: seatManagementModal.seatName,
          floor: seatManagementModal.floor,
          section: seatManagementModal.section,
          is_available: true
        })

      if (error) throw error

      // Refresh seats
      await fetchSeats()
      setSeatManagementModal({
        isOpen: false,
        seatName: '',
        floor: '10F',
        section: 'Section A'
      })

      alert(`Successfully added seat ${seatManagementModal.seatName}!`)
    } catch (error) {
      console.error('Error adding seat:', error)
      alert('Failed to add seat. Please check if the seat name already exists.')
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('seat_bookings')
        .update({ is_cancelled: true })
        .eq('id', bookingId)

      if (error) throw error

      await fetchBookings()
      alert('Booking cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tr-orange mx-auto mb-4"></div>
          <p className="text-tr-gray">Loading seat map...</p>
        </div>
      </div>
    )
  }

  const sectionedSeats = groupSeatsBySection()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-tr-gray mb-2">Office Seat Map</h1>
            <p className="text-gray-600">Book your workspace for the office (up to 2 weeks in advance)</p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-tr-gray mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={formatDate(new Date())}
                max={getMaxBookingDate()}
                className="input-field"
                title="Select date for viewing seat availability"
              />
              <p className="text-xs text-gray-500 mt-1">
                Today to {getMaxBookingDate()} (2 weeks ahead)
              </p>
            </div>
            {userProfile && (userProfile.role === 'Manager' || userProfile.role === 'Admin') && (
              <button
                onClick={() => setSeatManagementModal({ ...seatManagementModal, isOpen: true })}
                className="btn-primary mt-6"
              >
                Manage Seats
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 card p-4">
          <h3 className="font-medium text-tr-gray mb-3">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded border"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-tr-orange rounded border"></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-400 rounded border"></div>
              <span className="text-sm">Unavailable</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded border"></div>
              <span className="text-sm">Your Booking</span>
            </div>
          </div>
        </div>

        {/* Seat Sections */}
        <div className="space-y-8">
          {Object.entries(sectionedSeats).map(([sectionName, sectionSeats]) => (
            <div key={sectionName} className="card p-6">
              <h2 className="text-xl font-semibold text-tr-gray mb-4">{sectionName}</h2>
              {/* Mobile Zoomable Container */}
              <div className="overflow-x-auto overflow-y-hidden touch-pan-x md:overflow-visible">
                <div className="min-w-[800px] md:min-w-0">
                  <div className="grid grid-cols-8 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {sectionSeats.map((seat) => {
                      const booking = getSeatBooking(seat.id)
                      const isMyBooking = booking && booking.user_id === userProfile?.id
                      const isBooked = !!booking
                      const isAvailable = seat.is_available && !isBooked

                      return (
                        <div
                          key={seat.id}
                          className={`
                            relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm
                            ${isMyBooking ? 'bg-blue-500 text-white border-blue-600' : ''}
                            ${isBooked && !isMyBooking ? 'bg-tr-orange text-white border-orange-600' : ''}
                            ${isAvailable ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' : ''}
                            ${!seat.is_available ? 'bg-gray-400 text-white border-gray-500 cursor-not-allowed' : ''}
                          `}
                          onClick={() => isAvailable ? handleSeatClick(seat) : null}
                          title={
                            isBooked 
                              ? `Booked by ${booking?.profiles?.first_name || 'Unknown'} ${booking?.profiles?.last_name || ''}`
                              : isAvailable 
                                ? 'Click to book'
                                : 'Unavailable'
                          }
                        >
                          <div className="font-medium">{seat.seat_name}</div>
                          {isMyBooking && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelBooking(booking.id)
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              title="Cancel booking"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-tr-gray mb-4">
              Book Seat {bookingModal.seat?.seat_name}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="multiDay"
                  checked={bookingModal.isMultiDay}
                  onChange={(e) => setBookingModal({ ...bookingModal, isMultiDay: e.target.checked })}
                  className="rounded border-gray-300 text-tr-orange focus:ring-tr-orange"
                />
                <label htmlFor="multiDay" className="text-sm font-medium text-tr-gray">
                  Multi-day booking
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-tr-gray mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bookingModal.startDate}
                    onChange={(e) => setBookingModal({ ...bookingModal, startDate: e.target.value })}
                    min={formatDate(new Date())}
                    max={getMaxBookingDate()}
                    className="input-field"
                    title="Select start date for booking (up to 2 weeks ahead)"
                  />
                </div>
                
                {bookingModal.isMultiDay && (
                  <div>
                    <label className="block text-sm font-medium text-tr-gray mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={bookingModal.endDate}
                      onChange={(e) => setBookingModal({ ...bookingModal, endDate: e.target.value })}
                      min={bookingModal.startDate}
                      max={getMaxBookingDate()}
                      className="input-field"
                      title="Select end date for booking (up to 2 weeks ahead)"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-tr-gray mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={bookingModal.startTime}
                    onChange={(e) => setBookingModal({ ...bookingModal, startTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-tr-gray mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={bookingModal.endTime}
                    onChange={(e) => setBookingModal({ ...bookingModal, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <a
                href={generateCalendarEvent()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-center flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <span>Add to Calendar</span>
              </a>
              <button
                onClick={() => setBookingModal({ ...bookingModal, isOpen: false })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSeat}
                className="btn-primary"
              >
                Book Seat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Management Modal */}
      {seatManagementModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-tr-gray mb-4">Add New Seat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Seat Name
                </label>
                <input
                  type="text"
                  value={seatManagementModal.seatName}
                  onChange={(e) => setSeatManagementModal({ ...seatManagementModal, seatName: e.target.value })}
                  placeholder="e.g., 1820-10F-101"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={seatManagementModal.floor}
                  onChange={(e) => setSeatManagementModal({ ...seatManagementModal, floor: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Section
                </label>
                <select
                  value={seatManagementModal.section}
                  onChange={(e) => setSeatManagementModal({ ...seatManagementModal, section: e.target.value })}
                  className="input-field"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                  <option value="Section E">Section E</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSeatManagementModal({ ...seatManagementModal, isOpen: false })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSeat}
                className="btn-primary"
              >
                Add Seat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatMap