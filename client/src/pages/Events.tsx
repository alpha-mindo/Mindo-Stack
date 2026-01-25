import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import './Dashboard.css'

interface Event {
  _id: string
  clubId: {
    _id: string
    name: string
  }
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  status: string
  attendees: string[]
}

function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/clubs/my-events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (err: any) {
      console.error('Error fetching events:', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <h1>Events & Trips</h1>
            <p>Upcoming events from your clubs</p>
          </div>

          <div className="content-section">
            {loading ? (
              <div>Loading events...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No upcoming events</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {events.map(event => (
                  <div key={event._id} className="sidebar-card" onClick={() => navigate(`/clubs/${event.clubId._id}/events/${event._id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                      <div style={{ 
                        minWidth: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                          {new Date(event.startDate).getDate()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3>{event.name}</h3>
                        <p style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.25rem' }}>{event.clubId.name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>{event.description}</p>
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          <span>📍 {event.location}</span>
                          <span>🕐 {formatDate(event.startDate)}</span>
                          <span>👥 {event.attendees.length} attending</span>
                        </div>
                      </div>
                      <div>
                        <span style={{ 
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: event.status === 'upcoming' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                          color: event.status === 'upcoming' ? '#4ade80' : '#a78bfa'
                        }}>
                          {event.status}
                        </span>
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

export default Events
