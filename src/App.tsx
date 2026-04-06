import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import MemberCalendar from './components/MemberCalendar'
import SeatMap from './components/SeatMap'
import { supabase } from './lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
          {session ? (
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<MemberCalendar />} />
                <Route path="/seat-map" element={<SeatMap />} />
                <Route path="/rto-calculator" element={<MemberCalendar />} />
                <Route path="/reports" element={<div>Reports (Coming Soon)</div>} />
                <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
              </Routes>
            </>
          ) : (
            <Login />
          )}
      </div>
    </ToastProvider>
  )
}

export default App