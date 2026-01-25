import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import './Dashboard.css'

interface Announcement {
  _id: string
  clubId: {
    _id: string
    name: string
  }
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  authorId: {
    username: string
  }
}

function Messages() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/announcements/my-announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch announcements')
      
      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (err) {
      console.error('Error fetching announcements:', err)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      default: return '#6366f1'
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
            <h1>Messages & Announcements</h1>
            <p>Stay updated with your clubs</p>
          </div>

          <div className="content-section">
            {loading ? (
              <div>Loading messages...</div>
            ) : announcements.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p>No messages or announcements yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {announcements.map(announcement => (
                  <div key={announcement._id} className="sidebar-card" style={{ borderLeft: `4px solid ${getPriorityColor(announcement.priority)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3>{announcement.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.25rem' }}>
                          {announcement.clubId.name} • Posted by {announcement.authorId.username}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {formatTimeAgo(announcement.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                      {announcement.content}
                    </p>
                    <div style={{ marginTop: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: `${getPriorityColor(announcement.priority)}20`,
                        color: getPriorityColor(announcement.priority)
                      }}>
                        {announcement.priority.toUpperCase()} PRIORITY
                      </span>
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

export default Messages
