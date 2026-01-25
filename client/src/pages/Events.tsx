import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Users as UsersIcon } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'

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
    <PageContainer>
      <Background>
        <GradientOrb style={{ top: '10%', left: '10%' }} />
        <GradientOrb style={{ top: '60%', right: '15%' }} />
        <GradientOrb style={{ bottom: '10%', left: '50%' }} />
        <GridPattern />
      </Background>

      <Navbar />
      <Notifications />

      <MainContent>
        <ContentWrapper>
          <Header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Title>Events & Trips</Title>
            <Subtitle>Upcoming events from your clubs</Subtitle>
          </Header>

          <Section>
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading events...</LoadingText>
              </LoadingContainer>
            ) : error ? (
              <ErrorMessage>{error}</ErrorMessage>
            ) : events.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <EmptyIcon>
                  <Calendar size={64} />
                </EmptyIcon>
                <EmptyTitle>No Upcoming Events</EmptyTitle>
                <EmptyText>Check back later for events from your clubs</EmptyText>
              </EmptyState>
            ) : (
              <EventsList>
                {events.map((event, index) => (
                  <EventCard
                    key={event._id}
                    onClick={() => navigate(`/clubs/${event.clubId._id}/events/${event._id}`)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <DateBadge>
                      <DateDay>{new Date(event.startDate).getDate()}</DateDay>
                      <DateMonth>
                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                      </DateMonth>
                    </DateBadge>

                    <EventContent>
                      <EventHeader>
                        <EventTitle>{event.name}</EventTitle>
                        <StatusBadge $status={event.status}>
                          {event.status}
                        </StatusBadge>
                      </EventHeader>

                      <ClubName>{event.clubId.name}</ClubName>
                      <EventDescription>{event.description}</EventDescription>

                      <EventMeta>
                        <MetaItem>
                          <MapPin size={16} />
                          {event.location}
                        </MetaItem>
                        <MetaItem>
                          <Clock size={16} />
                          {formatDate(event.startDate)}
                        </MetaItem>
                        <MetaItem>
                          <UsersIcon size={16} />
                          {event.attendees.length} attending
                        </MetaItem>
                      </EventMeta>
                    </EventContent>
                  </EventCard>
                ))}
              </EventsList>
            )}
          </Section>
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
  animation: float 20s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, 30px); }
  }
`

const GridPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
`

const MainContent = styled.main`
  margin-left: 280px;
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 2rem;
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  margin-bottom: 3rem;
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0 0 0;
`

const Section = styled.section`
  margin-top: 2rem;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
`

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
`

const ErrorMessage = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  color: #f87171;
  text-align: center;
`

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
`

const EmptyIcon = styled.div`
  color: rgba(99, 102, 241, 0.3);
  margin-bottom: 1.5rem;
`

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
`

const EmptyText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  max-width: 400px;
`

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const EventCard = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.2);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const DateBadge = styled.div`
  min-width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
`

const DateDay = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  line-height: 1;
`

const DateMonth = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  margin-top: 0.25rem;
`

const EventContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`

const EventTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  flex: 1;
`

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  
  ${props => props.$status === 'upcoming' ? `
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
  ` : `
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #a78bfa;
  `}
`

const ClubName = styled.p`
  font-size: 0.875rem;
  color: #a78bfa;
  font-weight: 500;
  margin: 0;
`

const EventDescription = styled.p`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const EventMeta = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  
  svg {
    color: rgba(99, 102, 241, 0.7);
  }
`

export default Events
