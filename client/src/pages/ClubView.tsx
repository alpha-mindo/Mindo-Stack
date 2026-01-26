import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Calendar, FileText, MapPin, Megaphone, Image } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface Club {
  _id: string
  name: string
  description: string
  logo: string | null
  category: string
  memberCount: number
}

interface Announcement {
  _id: string
  title: string
  content: string
  createdBy: {
    username: string
  }
  createdAt: string
}

interface Trip {
  _id: string
  destination: string
  description: string
  date: string
  cost: number
  maxParticipants: number
  currentParticipants: number
}

interface Content {
  _id: string
  title: string
  type: string
  url: string
  uploadedBy: {
    username: string
  }
  createdAt: string
}

function ClubView() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const [club, setClub] = useState<Club | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [activeTab, setActiveTab] = useState('announcements')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClubDetails()
    fetchAnnouncements()
    fetchTrips()
    fetchContent()
  }, [clubId])

  const fetchClubDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setClub(data.club)
      }
    } catch (err) {
      console.error('Error fetching club:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
  }

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/trips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (err) {
      console.error('Error fetching trips:', err)
    }
  }

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setContent(data.content || [])
      }
    } catch (err) {
      console.error('Error fetching content:', err)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <LoadingText>Loading club details...</LoadingText>
        </MainContent>
      </PageContainer>
    )
  }

  if (!club) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <ErrorText>Club not found</ErrorText>
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
          <BackButton onClick={() => navigate('/memberships')}>
            <ArrowLeft size={20} />
            Back to Memberships
          </BackButton>

          <ClubHeader
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ClubHeaderContent>
              {club.logo ? (
                <ClubLogo src={club.logo} alt={club.name} />
              ) : (
                <ClubLogoPlaceholder>
                  {club.name.charAt(0).toUpperCase()}
                </ClubLogoPlaceholder>
              )}
              <ClubInfo>
                <ClubName>{club.name}</ClubName>
                <ClubCategory>{club.category}</ClubCategory>
                <ClubDescription>{club.description}</ClubDescription>
                <ClubStat>
                  <Users size={16} />
                  {club.memberCount} members
                </ClubStat>
              </ClubInfo>
            </ClubHeaderContent>
          </ClubHeader>

          <TabsContainer>
            <Tab
              $active={activeTab === 'announcements'}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone size={16} />
              Announcements
            </Tab>
            <Tab
              $active={activeTab === 'trips'}
              onClick={() => setActiveTab('trips')}
            >
              <MapPin size={16} />
              Trips
            </Tab>
            <Tab
              $active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
            >
              <FileText size={16} />
              Content
            </Tab>
          </TabsContainer>

          <TabContent
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeTab === 'announcements' && (
              <>
                {announcements.length === 0 ? (
                  <EmptyState>
                    <Megaphone size={48} />
                    <EmptyTitle>No Announcements</EmptyTitle>
                    <EmptyText>This club hasn't posted any announcements yet.</EmptyText>
                  </EmptyState>
                ) : (
                  <ItemsGrid>
                    {announcements.map((announcement) => (
                      <AnnouncementCard key={announcement._id}>
                        <AnnouncementHeader>
                          <AnnouncementIcon>
                            <Megaphone size={20} />
                          </AnnouncementIcon>
                          <AnnouncementInfo>
                            <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                            <AnnouncementMeta>
                              By {announcement.createdBy.username} • {new Date(announcement.createdAt).toLocaleDateString()}
                            </AnnouncementMeta>
                          </AnnouncementInfo>
                        </AnnouncementHeader>
                        <AnnouncementContent>{announcement.content}</AnnouncementContent>
                      </AnnouncementCard>
                    ))}
                  </ItemsGrid>
                )}
              </>
            )}

            {activeTab === 'trips' && (
              <>
                {trips.length === 0 ? (
                  <EmptyState>
                    <MapPin size={48} />
                    <EmptyTitle>No Trips</EmptyTitle>
                    <EmptyText>This club hasn't organized any trips yet.</EmptyText>
                  </EmptyState>
                ) : (
                  <ItemsGrid>
                    {trips.map((trip) => (
                      <TripCard key={trip._id}>
                        <TripHeader>
                          <TripIcon>
                            <MapPin size={20} />
                          </TripIcon>
                          <TripDestination>{trip.destination}</TripDestination>
                        </TripHeader>
                        <TripDescription>{trip.description}</TripDescription>
                        <TripDetails>
                          <TripDetail>
                            <Calendar size={16} />
                            {new Date(trip.date).toLocaleDateString()}
                          </TripDetail>
                          <TripDetail>
                            <Users size={16} />
                            {trip.currentParticipants}/{trip.maxParticipants} participants
                          </TripDetail>
                        </TripDetails>
                        <TripCost>${trip.cost}</TripCost>
                      </TripCard>
                    ))}
                  </ItemsGrid>
                )}
              </>
            )}

            {activeTab === 'content' && (
              <>
                {content.length === 0 ? (
                  <EmptyState>
                    <FileText size={48} />
                    <EmptyTitle>No Content</EmptyTitle>
                    <EmptyText>This club hasn't uploaded any content yet.</EmptyText>
                  </EmptyState>
                ) : (
                  <ItemsGrid>
                    {content.map((item) => (
                      <ContentCard key={item._id}>
                        <ContentIcon $type={item.type}>
                          {item.type === 'image' ? <Image size={20} /> : <FileText size={20} />}
                        </ContentIcon>
                        <ContentInfo>
                          <ContentTitle>{item.title}</ContentTitle>
                          <ContentMeta>
                            By {item.uploadedBy.username} • {new Date(item.createdAt).toLocaleDateString()}
                          </ContentMeta>
                          <ContentLink href={item.url} target="_blank" rel="noopener noreferrer">
                            View {item.type}
                          </ContentLink>
                        </ContentInfo>
                      </ContentCard>
                    ))}
                  </ItemsGrid>
                )}
              </>
            )}
          </TabContent>
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
  max-width: 1200px;
  margin: 0 auto;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(139, 92, 246, 0.3);
  }
`

const ClubHeader = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`

const ClubHeaderContent = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
`

const ClubLogo = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
`

const ClubLogoPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
`

const ClubInfo = styled.div`
  flex: 1;
`

const ClubName = styled.h1`
  color: rgba(255, 255, 255, 0.95);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
`

const ClubCategory = styled.div`
  color: rgba(139, 92, 246, 1);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`

const ClubDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
`

const ClubStat = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9375rem;
  
  svg {
    color: rgba(139, 92, 246, 0.8);
  }
`

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`

const Tab = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(139, 92, 246, 0.2)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? 'rgba(139, 92, 246, 1)' : 'rgba(255, 255, 255, 0.7)'};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
    color: rgba(139, 92, 246, 1);
  }
`

const TabContent = styled(motion.div)`
  min-height: 400px;
`

const ItemsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  svg {
    opacity: 0.3;
  }
`

const EmptyTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`

const EmptyText = styled.p`
  max-width: 400px;
  margin: 0;
`

const AnnouncementCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }
`

const AnnouncementHeader = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`

const AnnouncementIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(139, 92, 246, 1);
  flex-shrink: 0;
`

const AnnouncementInfo = styled.div`
  flex: 1;
`

const AnnouncementTitle = styled.h3`
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`

const AnnouncementMeta = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
`

const AnnouncementContent = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
`

const TripCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }
`

const TripHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const TripIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(16, 185, 129, 1);
`

const TripDestination = styled.h3`
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`

const TripDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
`

const TripDetails = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
`

const TripDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  
  svg {
    color: rgba(139, 92, 246, 0.8);
  }
`

const TripCost = styled.div`
  color: rgba(16, 185, 129, 1);
  font-size: 1.25rem;
  font-weight: 700;
`

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }
`

const ContentIcon = styled.div<{ $type: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$type === 'image' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$type === 'image' ? 'rgba(245, 158, 11, 1)' : 'rgba(59, 130, 246, 1)'};
  flex-shrink: 0;
`

const ContentInfo = styled.div`
  flex: 1;
`

const ContentTitle = styled.h3`
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`

const ContentMeta = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`

const ContentLink = styled.a`
  color: rgba(139, 92, 246, 1);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 4rem 0;
  font-size: 1.125rem;
`

const ErrorText = styled.div`
  text-align: center;
  color: rgba(239, 68, 68, 0.9);
  padding: 4rem 0;
  font-size: 1.125rem;
`

export default ClubView
