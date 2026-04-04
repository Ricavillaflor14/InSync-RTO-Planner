import { useState, useEffect } from 'react'
import { getCurrentUser, getUserProfile, UserProfile, supabase } from '../lib/supabaseClient'
import { formatDate, calculateRTO, getMonthWeekdays } from '../lib/rtoCalculations'
import { DashboardSkeleton, StatCardSkeleton, LoadingSpinner } from '../components/LoadingSkeletons'
import BuddyFinder from '../components/BuddyFinder'
import RTOCheckIn from '../components/RTOCheckIn'
import BulkEntryModal from '../components/BulkEntryModal'
import { useToast } from '../contexts/ToastContext'

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBulkEntryModal, setShowBulkEntryModal] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tr-orange mx-auto mb-4"></div>
          <p className="text-tr-gray">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tr-gray mb-2">
            Welcome to InSync
          </h1>
          <p className="text-gray-600">
            {userProfile ? (
              <>Welcome back, {userProfile.first_name || userProfile.email}! Your role: <span className="font-semibold text-tr-orange">{userProfile.role}</span></>
            ) : (
              'Managing your return to office planning made simple.'
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-tr-orange bg-opacity-10">
                <svg className="h-8 w-8 text-tr-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-tr-gray">142</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">RTO Compliance</p>
                <p className="text-2xl font-bold text-tr-gray">87%</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m0 0H5m0 0H3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Seats</p>
                <p className="text-2xl font-bold text-tr-gray">12/34</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Days This Week</p>
                <p className="text-2xl font-bold text-tr-gray">3/5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* RTO Check-In */}
          <RTOCheckIn />
          
          {/* Buddy Finder */}
          <BuddyFinder isCompact />
        </div>

        {/* Role-based Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions - All Roles */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-tr-gray mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="btn-primary text-left p-4 h-auto flex flex-col items-start">
                  <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-medium">Book a Seat</span>
                  <span className="text-sm opacity-90">Reserve your workspace</span>
                </button>
                
                <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start">
                  <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Calculate RTO</span>
                  <span className="text-sm">Plan office days</span>
                </button>

                {/* Bulk Entry - All Members */}
                <button 
                  onClick={() => setShowBulkEntryModal(true)}
                  className="btn-secondary text-left p-4 h-auto flex flex-col items-start border-2 border-purple-500"
                >
                  <svg className="h-8 w-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium text-purple-600">Bulk Time Entry</span>
                  <span className="text-sm text-purple-600">Add multiple days WFA/Leave</span>
                </button>
                
                {/* Manager/Admin Only Actions */}
                {userProfile && (userProfile.role === 'Manager' || userProfile.role === 'Admin') && (
                  <>
                    <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start border-2 border-tr-orange">
                      <svg className="h-8 w-8 mb-2 text-tr-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium text-tr-orange">Team Reports</span>
                      <span className="text-sm text-tr-orange">View team analytics</span>
                    </button>
                    
                    <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start border-2 border-tr-orange">
                      <svg className="h-8 w-8 mb-2 text-tr-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m0 0H5m0 0H3" />
                      </svg>
                      <span className="font-medium text-tr-orange">Manage Seats</span>
                      <span className="text-sm text-tr-orange">Configure office layout</span>
                    </button>
                  </>
                )}
                
                {/* Admin Only Actions */}
                {userProfile && userProfile.role === 'Admin' && (
                  <>
                    <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start border-2 border-red-500">
                      <svg className="h-8 w-8 mb-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span className="font-medium text-red-600">User Management</span>
                      <span className="text-sm text-red-600">Manage users & roles</span>
                    </button>
                    
                    <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start border-2 border-red-500">
                      <svg className="h-8 w-8 mb-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-red-600">System Settings</span>
                      <span className="text-sm text-red-600">Configure system</span>
                    </button>
                  </>
                )}
                
                <button className="btn-secondary text-left p-4 h-auto flex flex-col items-start">
                  <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">My Profile</span>
                  <span className="text-sm">Update personal info</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity & Role-specific Info */}
          <div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-tr-gray mb-4 flex items-center">
                Recent Activity
                <span className="ml-2 px-2 py-1 bg-tr-orange text-white text-xs rounded-full">
                  {userProfile?.role || 'User'}
                </span>
              </h3>
              <div className="space-y-4">
                {/* Member Activity */}
                {userProfile?.role === 'Member' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-tr-orange rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">Seat 1820-10F-075 booked for today</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">RTO target achieved for this month</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Manager Activity */}
                {userProfile?.role === 'Manager' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-tr-orange rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">Team compliance report generated</p>
                        <p className="text-xs text-gray-500">30 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">New seat 1820-10F-101 added</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">5 team members checked in</p>
                        <p className="text-xs text-gray-500">3 hours ago</p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Admin Activity */}
                {userProfile?.role === 'Admin' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">System backup completed</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-tr-orange rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">3 new users onboarded</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tr-gray">Holiday calendar updated</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Entry Modal */}
      <BulkEntryModal
        isOpen={showBulkEntryModal}
        onClose={() => setShowBulkEntryModal(false)}
        onSuccess={() => {
          // Optionally refresh dashboard data here
          console.log('Bulk entries created successfully')
        }}
      />
    </div>
  )
}

export default Dashboard
