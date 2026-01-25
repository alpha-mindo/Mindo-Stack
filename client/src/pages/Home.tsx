import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import './Home.css'

function Home() {
  const { user } = useAuth()

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

      {/* Main Content */}
      <main className="home-main" style={{ marginLeft: '280px' }}>
        <div className="main-content">
          <div className="welcome-banner">
            <h1>Welcome back, {user?.username}!</h1>
            <p>Here's what's happening with your clubs today</p>
          </div>

          <div className="content-grid">
            {/* Main content area */}
            <div className="content-primary">
              <section className="content-section">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">No recent activity yet</p>
                      <span className="activity-time">Start by joining a club</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="content-section">
                <h2 className="section-title">Upcoming Events</h2>
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No upcoming events</p>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="content-sidebar">
              <div className="sidebar-card">
                <h3 className="sidebar-title">Quick Stats</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">My Clubs</span>
                    <span className="stat-value">0</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Events Attended</span>
                    <span className="stat-value">0</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Messages</span>
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h3 className="sidebar-title">Suggested Clubs</h3>
                <div className="empty-state-small">
                  <p>No suggestions yet</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
