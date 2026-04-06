// Loading Skeleton Components for InSync Application

export const CardSkeleton = () => (
  <div className="card p-6 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
)

export const StatCardSkeleton = () => (
  <div className="card p-6 animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      <div className="h-8 bg-gray-300 rounded w-1/3"></div>
    </div>
  </div>
)

export const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-300 rounded w-full"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </td>
  </tr>
)

export const CalendarSkeleton = () => (
  <div className="card p-6 animate-pulse">
    {/* Days of week header */}
    <div className="grid grid-cols-7 gap-2 mb-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-300 rounded"></div>
      ))}
    </div>
    
    {/* Calendar grid */}
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-300 rounded"></div>
      ))}
    </div>
  </div>
)

export const SeatMapSkeleton = () => (
  <div className="space-y-8">
    {/* Section headers */}
    {Array.from({ length: 4 }).map((_, sectionIndex) => (
      <div key={sectionIndex} className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array.from({ length: 8 + sectionIndex * 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Header Skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CardSkeleton />
        </div>
      </div>
    </div>
  </div>
)


export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-t-tr-orange border-gray-300 ${sizeClasses[size]}`}></div>
  )
}

// Utility component for inline loading states
export const InlineLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex items-center justify-center space-x-2 py-8">
    <LoadingSpinner />
    <span className="text-gray-600">{text}</span>
  </div>
)