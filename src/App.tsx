// src/App.tsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './components/SignIn'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import Navigation from './components/Navigation'

interface User {
  name: string
  email: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleSignIn = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleSignOut = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const updateProfile = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  if (loading) return null // prevent route mismatch flash

  return (
    <Router basename="/">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user && <Navigation user={user} />}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <SignIn onSignIn={handleSignIn} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/profile" 
              element={user ? (
                <Profile 
                  user={user} 
                  onUpdateProfile={updateProfile} 
                  onSignOut={handleSignOut} 
                />
              ) : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
