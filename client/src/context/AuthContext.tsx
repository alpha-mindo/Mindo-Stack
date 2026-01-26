import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string
  username: string
  email: string
  isAdmin?: boolean
  profilePicture?: string
}

interface AuthResponse {
  success: boolean
  error?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  signup: (username: string, email: string, password: string) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

  useEffect(() => {
    // Set axios default header if token exists
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // You could fetch user data here if needed
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    }
    setLoading(false)
  }, [token])

  // Auto-logout after inactivity
  useEffect(() => {
    if (!user) return

    let inactivityTimer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        logout()
        alert('You have been logged out due to inactivity')
      }, INACTIVITY_TIMEOUT)
    }

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer)
    })

    // Start the timer
    resetTimer()

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer)
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [user])

  const signup = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post('/api/auth/signup', {
        username,
        email,
        password
      })
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setToken(token)
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed' 
      }
    }
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setToken(token)
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
