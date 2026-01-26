import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { HelpCircle, Plus, MessageCircle, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface Ticket {
  _id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  responses: any[]
  createdAt: string
}

function Help() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'Technical Support',
    priority: 'medium'
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        setShowModal(false)
        setForm({ subject: '', description: '', category: 'Technical Support', priority: 'medium' })
        fetchTickets()
        alert('Ticket submitted successfully!')
      }
    } catch (err) {
      alert('Error submitting ticket')
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
      case 'open': return <MessageCircle size={14} />
      case 'in-progress': return <Clock size={14} />
      case 'resolved': return <CheckCircle size={14} />
      default: return <MessageCircle size={14} />
    }
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
          <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <HeaderLeft>
              <Title>Help & Support</Title>
              <Subtitle>Submit tickets and track your support requests</Subtitle>
            </HeaderLeft>
            <AddButton onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New Ticket
            </AddButton>
          </Header>

          {loading ? (
            <LoadingText>Loading tickets...</LoadingText>
          ) : tickets.length === 0 ? (
            <EmptyState>
              <HelpCircle size={64} />
              <EmptyTitle>No Support Tickets</EmptyTitle>
              <EmptyText>Create a ticket if you need help</EmptyText>
            </EmptyState>
          ) : (
            <TicketsList>
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} onClick={() => navigate(`/help/${ticket._id}`)}>
                  <TicketHeader>
                    <TicketTitle>{ticket.subject}</TicketTitle>
                    <StatusBadge $color={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </StatusBadge>
                  </TicketHeader>
                  <TicketDescription>{ticket.description.substring(0, 150)}...</TicketDescription>
                  <TicketMeta>
                    <MetaItem>{ticket.category}</MetaItem>
                    <MetaItem>{new Date(ticket.createdAt).toLocaleDateString()}</MetaItem>
                    <MetaItem>{ticket.responses.length} responses</MetaItem>
                  </TicketMeta>
                </TicketCard>
              ))}
            </TicketsList>
          )}
        </ContentWrapper>
      </MainContent>

      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create Support Ticket</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </FormGroup>
              <FormGroup>
                <Label>Category</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Account Issue</option>
                  <option>Club Management</option>
                  <option>Technical Support</option>
                  <option>Other</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Priority</Label>
                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowModal(false)}>Cancel</CancelButton>
              <SubmitButton onClick={handleSubmit}>Submit Ticket</SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
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
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const HeaderLeft = styled.div``

const Title = styled.h1`
  color: rgba(255, 255, 255, 0.95);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0;
`

const AddButton = styled.button`
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
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
`

const TicketsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const TicketCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
  }
`

const TicketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`

const TicketTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`

const StatusBadge = styled.div<{ $color: string }>`
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: capitalize;
`

const TicketDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`

const TicketMeta = styled.div`
  display: flex;
  gap: 1.5rem;
`

const MetaItem = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;
`

const EmptyTitle = styled.h3`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  margin: 0;
`

const EmptyText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 2rem;
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const ModalContent = styled.div`
  background: rgba(20, 24, 45, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
`

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ModalTitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const ModalBody = styled.div`
  padding: 1.5rem;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const Select = styled.select`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const TextArea = styled.textarea`
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

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }
`

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
`

export default Help
