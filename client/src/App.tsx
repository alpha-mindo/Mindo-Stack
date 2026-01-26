import { ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Discover from './pages/Discover'
import Clubs from './pages/Clubs'
import ClubCreate from './pages/ClubCreate'
import ClubDetails from './pages/ClubDetails'
import ClubManage from './pages/ClubManage'
import EventManage from './pages/EventManage'
import ContentManage from './pages/ContentManage'
import Events from './pages/Events'
import Memberships from './pages/Memberships'
import ClubView from './pages/ClubView'
import Applications from './pages/Applications'
import Invitations from './pages/Invitations'
import Profile from './pages/Profile'
import Status from './pages/Status'
import Help from './pages/Help'
import TicketDetail from './pages/TicketDetail'
import AdminDashboard from './pages/AdminDashboard'
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
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password/:resetToken" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
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
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/discover" element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute>
              <Clubs />
            </ProtectedRoute>
          } />
          <Route path="/clubs/create" element={
            <ProtectedRoute>
              <ClubCreate />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:clubId" element={
            <ProtectedRoute>
              <ClubDetails />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:clubId/manage" element={
            <ProtectedRoute>
              <ClubManage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:clubId/events/manage" element={
            <ProtectedRoute>
              <EventManage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:clubId/content/manage" element={
            <ProtectedRoute>
              <ContentManage />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="/invitations" element={
            <ProtectedRoute>
              <Invitations />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } />
          <Route path="/memberships" element={
            <ProtectedRoute>
              <Memberships />
            </ProtectedRoute>
          } />
          <Route path="/memberships/:clubId" element={
            <ProtectedRoute>
              <ClubView />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />
          <Route path="/help/:id" element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
