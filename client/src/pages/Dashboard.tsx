import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Users, Calendar, Plus, Award, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface DashboardStats {
  totalClubs: number
  ownedClubs: number
  upcomingEvents: number
  unreadAnnouncements: number
}

interface QuickAction {
  id: string
  label: string
  icon: any
  path: string
  color: string
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalClubs: 0,
    ownedClubs: 0,
    upcomingEvents: 0,
    unreadAnnouncements: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch clubs data
      const clubsResponse = await fetch(`${API_URL}/api/clubs/my-clubs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json()
        const clubs = clubsData.clubs || []
        const ownedCount = clubs.filter((club: any) => club.isOwner).length
        setStats(prev => ({ ...prev, totalClubs: clubs.length, ownedClubs: ownedCount }))
      }

      // Fetch events data
      const eventsResponse = await fetch(`${API_URL}/api/clubs/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        const events = eventsData.events || []
        const upcoming = events.filter((event: any) => new Date(event.date) > new Date()).length
        setStats(prev => ({ ...prev, upcomingEvents: upcoming }))
      }

      // Fetch announcements data
      const announcementsResponse = await fetch(`${API_URL}/api/announcements/my-announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json()
        const announcements = announcementsData.announcements || []
        const unread = announcements.filter((a: any) => !a.isRead).length
        setStats(prev => ({ ...prev, unreadAnnouncements: unread }))
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'create-club',
      label: 'Create Club',
      icon: Plus,
      path: '/clubs/create',
      color: '#6366f1'
    },
    {
      id: 'discover',
      label: 'Discover Clubs',
      icon: Users,
      path: '/discover',
      color: '#a855f7'
    },
    {
      id: 'my-clubs',
      label: 'My Clubs',
      icon: Award,
      path: '/clubs',
      color: '#ec4899'
    },
    {
      id: 'events',
      label: 'View Events',
      icon: Calendar,
      path: '/events',
      color: '#8b5cf6'
    }
  ]

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
            <WelcomeText>
              <Title>Welcome back, {user?.username}!</Title>
              <Subtitle>Here's what's happening with your clubs</Subtitle>
            </WelcomeText>
          </Header>

          {loading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : (
            <>
              <StatsGrid
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StatCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <StatIcon style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
                    <Users size={24} style={{ color: '#6366f1' }} />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{stats.totalClubs}</StatValue>
                    <StatLabel>Total Clubs</StatLabel>
                  </StatInfo>
                </StatCard>

                <StatCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <StatIcon style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                    <Award size={24} style={{ color: '#a855f7' }} />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{stats.ownedClubs}</StatValue>
                    <StatLabel>Clubs Owned</StatLabel>
                  </StatInfo>
                </StatCard>

                <StatCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <StatIcon style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                    <Calendar size={24} style={{ color: '#8b5cf6' }} />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{stats.upcomingEvents}</StatValue>
                    <StatLabel>Upcoming Events</StatLabel>
                  </StatInfo>
                </StatCard>

                <StatCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <StatIcon style={{ background: 'rgba(236, 72, 153, 0.2)' }}>
                    <Bell size={24} style={{ color: '#ec4899' }} />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{stats.unreadAnnouncements}</StatValue>
                    <StatLabel>Unread Messages</StatLabel>
                  </StatInfo>
                </StatCard>
              </StatsGrid>

              <QuickActionsSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionTitle>Quick Actions</SectionTitle>
                <ActionsGrid>
                  {quickActions.map((action) => (
                    <ActionCard
                      key={action.id}
                      onClick={() => navigate(action.path)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ActionIcon style={{ background: `${action.color}20`, color: action.color }}>
                        <action.icon size={24} />
                      </ActionIcon>
                      <ActionLabel>{action.label}</ActionLabel>
                    </ActionCard>
                  ))}
                </ActionsGrid>
              </QuickActionsSection>

              <RecentSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SectionTitle>Getting Started</SectionTitle>
                <InfoCard>
                  <InfoTitle>Welcome to Mindo Stack!</InfoTitle>
                  <InfoText>
                    Explore clubs, join communities, and stay connected with events and announcements.
                  </InfoText>
                  <InfoActions>
                    <InfoButton
                      onClick={() => navigate('/discover')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Discover Clubs
                    </InfoButton>
                    <InfoButton
                      onClick={() => navigate('/clubs/create')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
                    >
                      Create Your Club
                    </InfoButton>
                  </InfoActions>
                </InfoCard>
              </RecentSection>
            </>
          )}
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
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  margin-bottom: 3rem;
`

const WelcomeText = styled.div``

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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const StatIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const StatInfo = styled.div`
  flex: 1;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
`

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
`

const QuickActionsSection = styled(motion.div)`
  margin-bottom: 3rem;
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1.5rem 0;
`

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`

const ActionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const ActionIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ActionLabel = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
`

const RecentSection = styled(motion.div)``

const InfoCard = styled.div`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);
`

const InfoTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
`

const InfoText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
`

const InfoActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`

const InfoButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
  }
`

export default Dashboard
