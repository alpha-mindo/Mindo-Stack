import { useState, FormEvent, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Auth.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await axios.post('/api/auth/forgot-password', { email })
      setMessage(response.data.message)
      setEmail('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <h1>Reset Password</h1>
            <p>Enter your email to receive reset instructions</p>
          </div>

          {error && <div className="error-message parsec-error">{error}</div>}
          {message && <div className="success-message parsec-success">{message}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button parsec-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
