import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Clock, CheckCircle, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface Response {
  _id: string
  userId: {
    _id: string
    username: string
    isAdmin: boolean
  }
  message: string
  isStaff: boolean
  createdAt: string
}

interface Ticket {
  _id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  userId: {
    _id: string
    username: string
  }
  responses: Response[]
  createdAt: string
}

function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
      }
    } catch (err) {
      console.error('Error fetching ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendResponse = async () => {
    if (!message.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets/${id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        setMessage('')
        fetchTicket()
      }
    } catch (err) {
      alert('Error sending response')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#6366f1'
      case 'in-progress': return '#f59e0b'
      case 'waiting-on-user': return '#8b5cf6'
      case 'resolved': return '#10b981'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageCircle size={16} />
      case 'in-progress': return <Clock size={16} />
      case 'resolved': return <CheckCircle size={16} />
      default: return <MessageCircle size={16} />
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <LoadingText>Loading ticket...</LoadingText>
        </MainContent>
      </PageContainer>
    )
  }

  if (!ticket) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <ErrorText>Ticket not found</ErrorText>
        </MainContent>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Background>
        <GradientOrb style={{ top: '10%', left: '10%' }} />
        <GradientOrb style={{ top: '60%', right: '15%' }} />
      </Background>

      <Navbar />
      <Notifications />

      <MainContent>
        <ContentWrapper>
          <BackButton onClick={() => navigate('/help')}>
            <ArrowLeft size={16} />
            Back to Tickets
          </BackButton>

          <TicketCard>
            <TicketHeader>
              <div>
                <TicketTitle>{ticket.subject}</TicketTitle>
                <TicketMeta>
                  <MetaItem>{ticket.category}</MetaItem>
                  <MetaItem>Priority: {ticket.priority}</MetaItem>
                  <MetaItem>{new Date(ticket.createdAt).toLocaleDateString()}</MetaItem>
                </TicketMeta>
              </div>
              <StatusBadge $color={getStatusColor(ticket.status)}>
                {getStatusIcon(ticket.status)}
                {ticket.status}
              </StatusBadge>
            </TicketHeader>

            <TicketDescription>{ticket.description}</TicketDescription>
          </TicketCard>

          <ResponsesSection>
            <SectionTitle>Conversation</SectionTitle>
            
            {ticket.responses.length === 0 ? (
              <EmptyResponses>No responses yet. Add a message to start the conversation.</EmptyResponses>
            ) : (
              <ResponsesList>
                {ticket.responses.map((response) => (
                  <ResponseItem key={response._id} $isStaff={response.isStaff}>
                    <ResponseHeader>
                      <ResponseAuthor>
                        {response.userId.username}
                        {response.isStaff && <StaffBadge>Staff</StaffBadge>}
                      </ResponseAuthor>
                      <ResponseTime>{new Date(response.createdAt).toLocaleString()}</ResponseTime>
                    </ResponseHeader>
                    <ResponseMessage>{response.message}</ResponseMessage>
                  </ResponseItem>
                ))}
              </ResponsesList>
            )}
          </ResponsesSection>

          <ResponseForm>
            <ResponseInput
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
            />
            <SendButton onClick={handleSendResponse} disabled={!message.trim()}>
              <Send size={16} />
              Send Response
            </SendButton>
          </ResponseForm>
        </ContentWrapper>
      </MainContent>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: rgba(10, 14, 35, 1);
  position: relative;
  overflow: hidden;
`

const Background = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`

const GradientOrb = styled(motion.div)`
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  filter: blur(60px);
`

const MainContent = styled.main`
  margin-left: 280px;
  padding: 2rem;
  position: relative;
  z-index: 1;
  min-height: 100vh;
`

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }
`

const TicketCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
`

const TicketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`

const TicketTitle = styled.h1`
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
`

const TicketMeta = styled.div`
  display: flex;
  gap: 1.5rem;
`

const MetaItem = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
`

const StatusBadge = styled.div<{ $color: string }>`
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: capitalize;
  white-space: nowrap;
`

const TicketDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`

const ResponsesSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
`

const ResponsesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ResponseItem = styled.div<{ $isStaff: boolean }>`
  background: ${props => props.$isStaff ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$isStaff ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  padding: 1rem;
`

const ResponseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

const ResponseAuthor = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StaffBadge = styled.span`
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`

const ResponseTime = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
`

const ResponseMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
`

const EmptyResponses = styled.div`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 2rem;
  font-size: 0.875rem;
`

const ResponseForm = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ResponseInput = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const SendButton = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  align-self: flex-end;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 2rem;
`

const ErrorText = styled.div`
  text-align: center;
  color: rgba(239, 68, 68, 0.8);
  padding: 2rem;
  font-size: 1.125rem;
`

export default TicketDetail
