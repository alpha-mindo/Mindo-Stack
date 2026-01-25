import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Notifications from './Notifications'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="home-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo-small">
            <div className="logo-circle-small"></div>
            <div className="logo-text-small">M</div>
          </div>
          <span className="brand-name-small">Mindo Stack</span>
        </div>

        <nav className="header-nav">
          <a href="#" className="nav-link active">Dashboard</a>
          <a href="#" className="nav-link">My Clubs</a>
          <a href="#" className="nav-link">Events</a>
          <a href="#" className="nav-link">Messages</a>
        </nav>

        <div className="header-actions">
          <Notifications />
          <div className="user-menu">
            <div className="user-avatar-small">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="user-name">{user?.username}</span>
          </div>
          <button onClick={handleSignOut} className="signout-btn-header">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
