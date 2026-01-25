import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { MessageSquare, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'

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
            <Title>Messages & Announcements</Title>
            <Subtitle>Stay updated with your clubs</Subtitle>
          </Header>

          <Section>
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading messages...</LoadingText>
              </LoadingContainer>
            ) : announcements.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <EmptyIcon>
                  <MessageSquare size={64} />
                </EmptyIcon>
                <EmptyTitle>No Messages Yet</EmptyTitle>
                <EmptyText>Check back later for announcements from your clubs</EmptyText>
              </EmptyState>
            ) : (
              <AnnouncementsList>
                {announcements.map((announcement, index) => (
                  <AnnouncementCard
                    key={announcement._id}
                    $priority={announcement.priority}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <CardHeader>
                      <HeaderLeft>
                        <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                        <AnnouncementMeta>
                          {announcement.clubId.name} • {announcement.authorId.username}
                        </AnnouncementMeta>
                      </HeaderLeft>
                      <HeaderRight>
                        <TimeAgo>{formatTimeAgo(announcement.createdAt)}</TimeAgo>
                        <PriorityBadge $priority={announcement.priority}>
                          <AlertCircle size={12} />
                          {announcement.priority} priority
                        </PriorityBadge>
                      </HeaderRight>
                    </CardHeader>
                    <AnnouncementContent>{announcement.content}</AnnouncementContent>
                  </AnnouncementCard>
                ))}
              </AnnouncementsList>
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
  max-width: 1000px;
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

const AnnouncementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const AnnouncementCard = styled(motion.div)<{ $priority: string }>`
  padding: 1.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  border-left: 4px solid ${props => {
    switch (props.$priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      default: return '#6366f1'
    }
  }};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
  }
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`

const HeaderLeft = styled.div`
  flex: 1;
`

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`

const AnnouncementTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`

const AnnouncementMeta = styled.p`
  font-size: 0.875rem;
  color: #a78bfa;
  font-weight: 500;
  margin: 0;
`

const TimeAgo = styled.span`
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
`

const PriorityBadge = styled.span<{ $priority: string }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  
  ${props => {
    switch (props.$priority) {
      case 'high':
        return `
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        `
      case 'medium':
        return `
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        `
      default:
        return `
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #a78bfa;
        `
    }
  }}
`

const AnnouncementContent = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`

export default Messages
