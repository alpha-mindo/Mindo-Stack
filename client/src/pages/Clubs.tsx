import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import './Dashboard.css'

interface Club {
  _id: string
  name: string
  description: string
  logo?: string
  category: string
  memberCount: number
  isOwner: boolean
}

function Clubs() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/clubs/my-clubs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch clubs')
      
      const data = await response.json()
      setClubs(data.clubs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createClub = () => {
    navigate('/clubs/create')
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
            <h1>My Clubs</h1>
            <p>Manage and explore your clubs</p>
          </div>

          <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title">Your Clubs</h2>
              <button className="auth-button gravity-button" onClick={createClub}>
                Create New Club
              </button>
            </div>

            {loading ? (
              <div>Loading clubs...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : clubs.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>You haven't joined any clubs yet</p>
                <button className="auth-button gravity-button" onClick={createClub} style={{ marginTop: '1rem' }}>
                  Create Your First Club
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {clubs.map(club => (
                  <div key={club._id} className="sidebar-card" onClick={() => navigate(`/clubs/${club._id}`)} style={{ cursor: 'pointer' }}>
                    {club.logo && <img src={club.logo} alt={club.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />}
                    <div style={{ padding: '1rem' }}>
                      <h3>{club.name}</h3>
                      {club.isOwner && <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>OWNER</span>}
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>{club.description}</p>
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{club.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{club.memberCount} members</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Clubs
