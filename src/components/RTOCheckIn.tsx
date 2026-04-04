import { useState } from 'react'
import { supabase, getCurrentUser } from '../lib/supabaseClient'
import { formatDate } from '../lib/rtoCalculations'
import { useToast } from '../contexts/ToastContext'
import { LoadingSpinner } from './LoadingSkeletons'

interface RTOCheckInProps {
  isCompact?: boolean;
}

const RTOCheckIn = ({ isCompact = false }: RTOCheckInProps) => {
  const [loading, setLoading] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const { showToast } = useToast()
  
  const handleCheckIn = async (entryType: 'OFFICE' | 'WFH') => {
    try {
      setLoading(true)
      
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const today = formatDate(new Date())
      
      // Check if already checked in today
      const { data: existingEntry, error: checkError } = await supabase
        .from('calendar_entries')
        .select('id, entry_type')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('calendar_entries')
          .update({ 
            entry_type: entryType,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id)
        
        if (updateError) throw updateError
        
        showToast(
          `Check-in updated to ${entryType === 'OFFICE' ? 'Office' : 'Work from Home'}`, 
          'success'
        )
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('calendar_entries')
          .insert({
            user_id: user.id,
            entry_date: today,
            entry_type: entryType,
            notes: `Checked in via dashboard at ${new Date().toLocaleTimeString()}`
          })
        
        if (insertError) throw insertError
        
        showToast(
          `Successfully checked in as ${entryType === 'OFFICE' ? 'Office' : 'Work from Home'}`, 
          'success'
        )
      }
      
      setCheckedIn(true)
      
    } catch (error) {
      console.error('Error checking in:', error)
      showToast('Failed to check in. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (isCompact) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => handleCheckIn('OFFICE')}
          disabled={loading}
          className="btn-primary px-4 py-2 text-sm flex items-center space-x-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : <span>🏢</span>}
          <span>Office</span>
        </button>
        <button
          onClick={() => handleCheckIn('WFH')}
          disabled={loading}
          className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : <span>🏠</span>}
          <span>WFH</span>
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-tr-gray mb-4 flex items-center">
        <span className="mr-2">📍</span>
        RTO Check-In
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({formatDate(new Date())})
        </span>
      </h3>
      
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Let us know where you're working today to help maintain accurate RTO tracking.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleCheckIn('OFFICE')}
            disabled={loading}
            className={`
              p-6 border-2 rounded-lg transition-all duration-200 text-left
              ${checkedIn 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-tr-orange hover:bg-orange-50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-tr-orange bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h4 className="font-semibold text-tr-gray">In Office</h4>
                  <p className="text-sm text-gray-600">Working from the office</p>
                </div>
              </div>
              {loading && <LoadingSpinner size="sm" />}
            </div>
          </button>
          
          <button
            onClick={() => handleCheckIn('WFH')}
            disabled={loading}
            className={`
              p-6 border-2 rounded-lg transition-all duration-200 text-left
              ${checkedIn 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
                <div>
                  <h4 className="font-semibold text-tr-gray">Work from Home</h4>
                  <p className="text-sm text-gray-600">Remote working today</p>
                </div>
              </div>
              {loading && <LoadingSpinner size="sm" />}
            </div>
          </button>
        </div>
        
        {checkedIn && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm text-green-800 font-medium">
                Check-in recorded successfully! You can update this anytime today.
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-tr-orange">12</p>
              <p className="text-xs text-gray-600">This Month</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">87%</p>
              <p className="text-xs text-gray-600">Compliance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-xs text-gray-600">This Week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RTOCheckIn