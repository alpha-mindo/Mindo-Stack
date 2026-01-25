import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import './Dashboard.css'

interface ProfileData {
  username: string
  email: string
  bio?: string
  avatar?: string
}

function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    email: '',
    bio: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        bio: '',
        avatar: ''
      })
    }
  }, [user])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      setMessage('Profile updated successfully!')
      setIsEditing(false)
      
      // Update local storage
      const updatedUser = { ...user, ...formData }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container gravity-home">
      <div className="home-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-pattern"></div>
      </div>

      <Navbar />
      <Notifications />

      <main className="home-main" style={{ marginLeft: '280px' }}>
        <div className="main-content">
          <div className="welcome-banner">
            <h1>My Profile</h1>
            <p>Manage your account settings</p>
          </div>

          <div className="content-section">
            <div className="sidebar-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Profile Information</h2>
                {!isEditing && (
                  <button 
                    className="auth-button gravity-button"
                    onClick={() => setIsEditing(true)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {message && <div className="success-message parsec-success" style={{ marginBottom: '1rem' }}>{message}</div>}
              {error && <div className="error-message parsec-error" style={{ marginBottom: '1rem' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {isEditing && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="auth-button gravity-button" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      className="auth-button gravity-button"
                      onClick={() => setIsEditing(false)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>

              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>Account Actions</h3>
                <button 
                  className="auth-button gravity-button"
                  onClick={() => navigate('/change-password')}
                  style={{ 
                    width: '100%',
                    background: 'rgba(99, 102, 241, 0.1)',
                    marginBottom: '0.5rem'
                  }}
                >
                  Change Password
                </button>
                <button 
                  className="auth-button gravity-button"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  style={{ 
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    color: '#f87171'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
