import { ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Clubs from './pages/Clubs'
import Events from './pages/Events'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Status from './pages/Status'
import './App.css'

interface RouteProps {
  children: ReactNode
}

// Protected Route wrapper
function ProtectedRoute({ children }: RouteProps) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

// Public Route wrapper (redirects to home if already logged in)
function PublicRoute({ children }: RouteProps) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }
  
  return !user ? <>{children}</> : <Navigate to="/home" />
}

// Admin Route wrapper (only accessible to admins)
function AdminRoute({ children }: RouteProps) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (!user.isAdmin) {
    return <Navigate to="/home" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/api" element={
            <AdminRoute>
              <Status />
            </AdminRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute>
              <Clubs />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
