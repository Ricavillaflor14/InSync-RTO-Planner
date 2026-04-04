import { useState } from 'react'
import { supabase, getCurrentUser } from '../lib/supabaseClient'
import { formatDate, parseDate, getDatesBetween } from '../lib/rtoCalculations'
import { useToast } from '../contexts/ToastContext'
import { LoadingSpinner } from './LoadingSkeletons'

interface BulkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type EntryType = 'WFA' | 'SL' | 'WFH' | 'OFFICE'

const BulkEntryModal = ({ isOpen, onClose, onSuccess }: BulkEntryModalProps) => {
  const [startDate, setStartDate] = useState(formatDate(new Date()))
  const [endDate, setEndDate] = useState(formatDate(new Date()))
  const [entryType, setEntryType] = useState<EntryType>('WFA')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const entryTypes = [
    { value: 'WFA', label: 'Work from Anywhere', icon: '✈️', color: 'purple' },
    { value: 'SL', label: 'Sick Leave', icon: '🏥', color: 'red' },
    { value: 'WFH', label: 'Work from Home', icon: '🏠', color: 'blue' },
    { value: 'OFFICE', label: 'In Office', icon: '🏢', color: 'green' }
  ]

  const getCurrentTypeData = () => {
    return entryTypes.find(type => type.value === entryType)!
  }

  const getPreviewDates = () => {
    if (!startDate || !endDate) return []
    
    const start = parseDate(startDate)
    const end = parseDate(endDate)
    
    if (start > end) return []
    
    return getDatesBetween(start, end)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const previewDates = getPreviewDates()
    if (previewDates.length === 0) {
      showToast('Please select valid dates', 'error')
      return
    }

    setLoading(true)
    
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Check for existing entries on the selected dates
      const dateStrings = previewDates.map(date => formatDate(date))
      const { data: existingEntries, error: checkError } = await supabase
        .from('calendar_entries')
        .select('entry_date, entry_type')
        .eq('user_id', user.id)
        .in('entry_date', dateStrings)

      if (checkError) throw checkError

      // Show warning if there are existing entries
      if (existingEntries && existingEntries.length > 0) {
        const existingDates = existingEntries.map(entry => entry.entry_date)
        const conflictMessage = `Found existing entries on: ${existingDates.join(', ')}. These will be overwritten.`
        
        if (!window.confirm(conflictMessage + '\n\nDo you want to continue?')) {
          setLoading(false)
          return
        }

        // Delete existing entries for the selected dates
        const { error: deleteError } = await supabase
          .from('calendar_entries')
          .delete()
          .eq('user_id', user.id)
          .in('entry_date', existingDates)

        if (deleteError) throw deleteError
      }

      // Create new entries for all dates in the range
      const entries = previewDates.map(date => ({
        user_id: user.id,
        entry_date: formatDate(date),
        entry_type: entryType,
        notes: notes.trim() || `Bulk entry: ${getCurrentTypeData().label}`
      }))

      const { error: insertError } = await supabase
        .from('calendar_entries')
        .insert(entries)

      if (insertError) throw insertError

      showToast(
        `Successfully added ${previewDates.length} ${getCurrentTypeData().label.toLowerCase()} entries`,
        'success'
      )

      // Reset form
      setStartDate(formatDate(new Date()))
      setEndDate(formatDate(new Date()))
      setNotes('')
      
      onClose()
      onSuccess?.()

    } catch (error) {
      console.error('Error creating bulk entries:', error)
      showToast('Failed to create entries. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const previewDates = getPreviewDates()
  const typeData = getCurrentTypeData()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-tr-gray">
              Create Bulk Time Entries
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Entry Type Selection */}
            <div>
              <label className="block text-sm font-medium text-tr-gray mb-3">
                Entry Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {entryTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEntryType(type.value as EntryType)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${entryType === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium text-tr-gray">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.value}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tr-gray mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-tr-gray mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Add notes for your ${typeData.label.toLowerCase()} entries...`}
                className="input-field h-20 resize-none"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {notes.length}/200 characters
              </div>
            </div>

            {/* Preview */}
            {previewDates.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-tr-gray mb-3 flex items-center">
                  <span className="text-lg mr-2">{typeData.icon}</span>
                  Preview: {previewDates.length} {typeData.label} entries
                </h4>
                
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    {previewDates.slice(0, 12).map((date, index) => (
                      <div
                        key={index}
                        className={`
                          px-2 py-1 rounded text-center text-white text-xs
                          ${typeData.color === 'purple' ? 'bg-purple-500' : ''}
                          ${typeData.color === 'red' ? 'bg-red-500' : ''}
                          ${typeData.color === 'blue' ? 'bg-blue-500' : ''}
                          ${typeData.color === 'green' ? 'bg-green-500' : ''}
                        `}
                      >
                        {formatDate(date)}
                      </div>
                    ))}
                    {previewDates.length > 12 && (
                      <div className="text-center text-gray-500 text-xs py-1">
                        +{previewDates.length - 12} more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {previewDates.length === 0 && startDate && endDate && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Invalid date range. Please ensure the end date is on or after the start date.
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || previewDates.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <span>{typeData.icon}</span>}
                <span>
                  {loading ? 'Creating...' : `Create ${previewDates.length} Entries`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BulkEntryModal