import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="welcome-section">
          <h1>Welcome to Mindo Stack!</h1>
          <p className="user-greeting">Hello, {user?.username}! 👋</p>
          <p className="user-email">{user?.email}</p>
        </div>

        <button onClick={handleSignOut} className="signout-btn">
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Home
