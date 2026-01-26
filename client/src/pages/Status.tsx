import { useState, useEffect } from 'react'
import './Auth.css'
import { API_URL } from '../config'

interface StatusData {
  server: string
  database: string
  timestamp: string
}

const Status = () => {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`)
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setStatus(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-container parsec-style">
        <div className="auth-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="status-loading">Loading system status...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="auth-container parsec-style">
        <div className="auth-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="auth-content-wrapper">
          <div className="auth-card parsec-card">
            <div className="error-message parsec-error">
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container parsec-style">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="auth-content-wrapper">
        <div className="auth-card parsec-card">
          <div className="auth-header">
            <h1>System Status</h1>
            <p>Current system information</p>
          </div>

          <div className="status-info">
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status
