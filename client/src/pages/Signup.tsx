import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

function Signup() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Updated password validation to match security requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)
    const result = await signup(formData.username, formData.email, formData.password)
    
    if (result.success) {
      navigate('/home')
    } else {
      setError(result.error || 'Signup failed')
    }
    
    setLoading(false)
  }

  return (
    <Container>
      <Background>
        <GradientOrb className="orb-1" />
        <GradientOrb className="orb-2" />
        <GradientOrb className="orb-3" />
      </Background>
      
      <ContentWrapper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <Header>
            <Title>Create Account</Title>
            <Subtitle>Join Mindo Stack today</Subtitle>
          </Header>

          {error && (
            <ErrorMessage
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </ErrorMessage>
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                <User size={16} />
                Username
              </Label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <Mail size={16} />
                Email
              </Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <Lock size={16} />
                Password
              </Label>
              <PasswordWrapper>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </PasswordToggle>
              </PasswordWrapper>
              <PasswordHint>
                8+ characters with uppercase, lowercase, number & special character
              </PasswordHint>
            </FormGroup>

            <FormGroup>
              <Label>
                <Lock size={16} />
                Confirm Password
              </Label>
              <PasswordWrapper>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </PasswordToggle>
              </PasswordWrapper>
            </FormGroup>

            <SubmitButton
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <Spinner />
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight size={18} />
                </>
              )}
            </SubmitButton>
          </Form>

          <Footer>
            <p>
              Already have an account?{' '}
              <StyledLink to="/login">Sign In</StyledLink>
            </p>
          </Footer>
        </Card>
      </ContentWrapper>
    </Container>
  )
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
`

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`

const GradientOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;

  &.orb-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
    top: -300px;
    left: -300px;
  }

  &.orb-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
    bottom: -250px;
    right: -250px;
    animation-delay: -7s;
  }

  &.orb-3 {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -14s;
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(100px, -100px) scale(1.1);
    }
    66% {
      transform: translate(-80px, 80px) scale(0.95);
    }
  }
`

const ContentWrapper = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
`

const Card = styled.div`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 
      0 24px 72px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 80px rgba(99, 102, 241, 0.15);
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
  }
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  color: #ffffff;
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  letter-spacing: -0.5px;
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 1rem;
`

const ErrorMessage = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.875rem;

  svg {
    opacity: 0.7;
  }
`

const Input = styled.input`
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.9375rem;
  color: #ffffff;
  transition: all 0.2s ease;
  outline: none;
  width: 100%;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
  }
`

const PasswordWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 6px;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
  }
`

const PasswordHint = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.25rem 0 0 0;
`

const SubmitButton = styled(motion.button)`
  margin-top: 0.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 
    0 4px 14px rgba(99, 102, 241, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    box-shadow: 
      0 8px 24px rgba(99, 102, 241, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) svg {
    transform: translateX(4px);
  }
`

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const Footer = styled.div`
  text-align: center;
  margin-top: 2rem;

  p {
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    font-size: 0.9375rem;
  }
`

const StyledLink = styled(Link)`
  color: #6366f1;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s ease;

  &:hover {
    color: #818cf8;
    text-decoration: underline;
  }
`

export default Signup
