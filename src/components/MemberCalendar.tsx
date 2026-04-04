import { useState, useEffect } from 'react'
import { supabase, getCurrentUser, UserProfile, getUserProfile } from '../lib/supabaseClient'
import { calculateRTO, getMonthWeekdays, getDatesBetween, isWeekday, formatDate, parseDate } from '../lib/rtoCalculations'

interface CalendarEntry {
  id?: string;
  user_id: string;
  entry_date: string;
  entry_type: 'OFFICE' | 'WFH' | 'SL' | 'WFA' | 'HOLIDAY';
  notes?: string;
}

interface BulkEntryModal {
  isOpen: boolean;
  startDate: string;
  endDate: string;
  entryType: string;
  notes: string;
}

const MemberCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [, ] = useState<Date[]>([])
  const [bulkModal, setBulkModal] = useState<BulkEntryModal>({
    isOpen: false,
    startDate: '',
    endDate: '',
    entryType: 'SL',
    notes: ''
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const entryTypes = [
    { value: 'OFFICE', label: 'Office Day', color: 'bg-tr-orange text-white' },
    { value: 'WFH', label: 'Work From Home', color: 'bg-blue-500 text-white' },
    { value: 'SL', label: 'Sick Leave', color: 'bg-red-500 text-white' },
    { value: 'WFA', label: 'Work From Anywhere', color: 'bg-green-500 text-white' },
    { value: 'HOLIDAY', label: 'Holiday', color: 'bg-gray-500 text-white' }
  ]

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setUserProfile(profile)
          await fetchCalendarData(user.id)
          await fetchHolidays()
        }
      } catch (error) {
        console.error('Error initializing calendar:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [currentDate])

  const fetchCalendarData = async (userId: string) => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('entry_date', formatDate(startOfMonth))
      .lte('entry_date', formatDate(endOfMonth))

    if (error) {
      console.error('Error fetching calendar entries:', error)
    } else {
      setCalendarEntries(data || [])
    }
  }

  const fetchHolidays = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('holiday_date', formatDate(startOfMonth))
      .lte('holiday_date', formatDate(endOfMonth))
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching holidays:', error)
    } else {
      setHolidays(data || [])
    }
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days = []
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 41) // 6 weeks

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    return days
  }

  const getEntryForDate = (date: Date): CalendarEntry | undefined => {
    const dateStr = formatDate(date)
    return calendarEntries.find(entry => entry.entry_date === dateStr)
  }

  const getHolidayForDate = (date: Date): any => {
    const dateStr = formatDate(date)
    return holidays.find(holiday => holiday.holiday_date === dateStr)
  }

  const handleDateClick = async (date: Date, entryType: string) => {
    if (!userProfile) return

    const dateStr = formatDate(date)
    const existingEntry = getEntryForDate(date)

    try {
      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('calendar_entries')
          .update({ entry_type: entryType })
          .eq('id', existingEntry.id)

        if (error) throw error
      } else {
        // Create new entry
        const { error } = await supabase
          .from('calendar_entries')
          .insert({
            user_id: userProfile.id,
            entry_date: dateStr,
            entry_type: entryType
          })

        if (error) throw error
      }

      // Refresh calendar data
      await fetchCalendarData(userProfile.id)
    } catch (error) {
      console.error('Error updating calendar entry:', error)
    }
  }

  const handleBulkEntry = async () => {
    if (!userProfile || !bulkModal.startDate || !bulkModal.endDate) return

    const startDate = parseDate(bulkModal.startDate)
    const endDate = parseDate(bulkModal.endDate)
    const dates = getDatesBetween(startDate, endDate)

    try {
      // Filter only weekdays if applicable
      const targetDates = dates.filter(date => {
        if (bulkModal.entryType === 'HOLIDAY') return true
        return isWeekday(date)
      })

      // Create entries for all dates
      const entries = targetDates.map(date => ({
        user_id: userProfile.id,
        entry_date: formatDate(date),
        entry_type: bulkModal.entryType,
        notes: bulkModal.notes || null
      }))

      // Delete existing entries for these dates first
      const dateStrings = targetDates.map(date => formatDate(date))
      await supabase
        .from('calendar_entries')
        .delete()
        .eq('user_id', userProfile.id)
        .in('entry_date', dateStrings)

      // Insert new entries
      const { error } = await supabase
        .from('calendar_entries')
        .insert(entries)

      if (error) throw error

      // Refresh calendar data
      await fetchCalendarData(userProfile.id)
      
      // Close modal
      setBulkModal({
        isOpen: false,
        startDate: '',
        endDate: '',
        entryType: 'SL',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating bulk entries:', error)
    }
  }

  const calculateMonthlyRTO = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const totalWeekdays = getMonthWeekdays(year, month)
    
    const monthEntries = calendarEntries.filter(entry => {
      const entryDate = parseDate(entry.entry_date)
      return entryDate.getMonth() === month && entryDate.getFullYear() === year
    })

    const holidayCount = holidays.length
    const siteWFHCount = 0 // This would come from company-wide WFH days
    const userLeavesCount = monthEntries.filter(e => e.entry_type === 'SL').length
    const wfaCount = monthEntries.filter(e => e.entry_type === 'WFA').length
    const officeDays = monthEntries.filter(e => e.entry_type === 'OFFICE').length

    const rtoResult = calculateRTO({
      totalWeekdays,
      holidays: holidayCount,
      siteWFH: siteWFHCount,
      userLeaves: userLeavesCount,
      wfa: wfaCount
    })

    return { ...rtoResult, officeDays }
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const openBulkModal = () => {
    setBulkModal({ ...bulkModal, isOpen: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tr-orange mx-auto mb-4"></div>
          <p className="text-tr-gray">Loading calendar...</p>
        </div>
      </div>
    )
  }

  const calendarDays = getCalendarDays()
  const rtoData = calculateMonthlyRTO()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-tr-gray mb-2">My Calendar</h1>
            <p className="text-gray-600">Plan your return to office schedule</p>
          </div>
          <button
            onClick={openBulkModal}
            className="btn-primary"
          >
            Bulk Entry
          </button>
        </div>

        {/* RTO Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-sm font-medium text-gray-600">Required Office Days</div>
            <div className="text-2xl font-bold text-tr-orange">{rtoData.requiredDays}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium text-gray-600">Current Office Days</div>
            <div className="text-2xl font-bold text-green-600">{rtoData.officeDays}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium text-gray-600">Working Days</div>
            <div className="text-2xl font-bold text-blue-600">{rtoData.totalWorkingDays}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium text-gray-600">Compliance</div>
            <div className={`text-2xl font-bold ${rtoData.officeDays >= rtoData.requiredDays ? 'text-green-600' : 'text-red-600'}`}>
              {rtoData.officeDays >= rtoData.requiredDays ? '✓' : '✗'}
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold text-tr-gray">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="card p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const entry = getEntryForDate(date)
              const holiday = getHolidayForDate(date)
              const entryTypeData = entryTypes.find(t => t.value === entry?.entry_type)

              return (
                <div
                  key={index}
                  className={`
                    p-2 min-h-[80px] border rounded-md cursor-pointer transition-all
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-100'}
                    ${isWeekend ? 'opacity-60' : ''}
                    hover:shadow-md
                  `}
                >
                  <div className="font-medium text-sm mb-1">
                    {date.getDate()}
                  </div>
                  
                  {holiday && (
                    <div className="text-xs bg-gray-500 text-white px-1 py-0.5 rounded mb-1">
                      Holiday
                    </div>
                  )}
                  
                  {entry && (
                    <div className={`text-xs px-1 py-0.5 rounded ${entryTypeData?.color || 'bg-gray-500 text-white'}`}>
                      {entryTypeData?.label || entry.entry_type}
                    </div>
                  )}
                  
                  {isCurrentMonth && !isWeekend && !holiday && (
                    <div className="mt-1 space-y-1">
                      <button
                        onClick={() => handleDateClick(date, 'OFFICE')}
                        className="w-full text-xs bg-tr-orange text-white px-1 py-0.5 rounded hover:bg-opacity-80"
                      >
                        Office
                      </button>
                      <button
                        onClick={() => handleDateClick(date, 'WFH')}
                        className="w-full text-xs bg-blue-500 text-white px-1 py-0.5 rounded hover:bg-opacity-80"
                      >
                        WFH
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 card p-4">
          <h3 className="font-medium text-tr-gray mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {entryTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${type.color}`}></div>
                <span className="text-sm text-gray-600">{type.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Entry Modal */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-tr-gray mb-4">Bulk Entry</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={bulkModal.startDate}
                  onChange={(e) => setBulkModal({ ...bulkModal, startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={bulkModal.endDate}
                  onChange={(e) => setBulkModal({ ...bulkModal, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Entry Type
                </label>
                <select
                  value={bulkModal.entryType}
                  onChange={(e) => setBulkModal({ ...bulkModal, entryType: e.target.value })}
                  className="input-field"
                >
                  {entryTypes.filter(type => type.value !== 'HOLIDAY').map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={bulkModal.notes}
                  onChange={(e) => setBulkModal({ ...bulkModal, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setBulkModal({ ...bulkModal, isOpen: false })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEntry}
                className="btn-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberCalendar