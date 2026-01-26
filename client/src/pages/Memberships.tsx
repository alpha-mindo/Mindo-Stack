import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Users, Crown, ChevronRight } from 'lucide-react'
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
  role?: string
  createdAt: string
}

function Memberships() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/my-memberships`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setClubs(data.memberships || [])
      } else {
        setClubs([])
      }
    } catch (err) {
      console.error('Error fetching memberships:', err)
      setClubs([])
    } finally {
      setLoading(false)
    }
  }

  const handleClubClick = (clubId: string) => {
    navigate(`/memberships/${clubId}`)
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
            <Title>My Memberships</Title>
            <Subtitle>Clubs you're a member of</Subtitle>
          </Header>

          {loading ? (
            <LoadingText>Loading your memberships...</LoadingText>
          ) : !clubs || clubs.length === 0 ? (
            <EmptyState
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Users size={64} />
              <EmptyTitle>No Memberships Yet</EmptyTitle>
              <EmptyText>
                You're not a member of any clubs yet. Explore the Discover page to find clubs that interest you!
              </EmptyText>
              <JoinButton onClick={() => navigate('/discover')}>
                Discover Clubs
              </JoinButton>
            </EmptyState>
          ) : (
            <ClubsGrid
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {clubs.map((club, index) => (
                <ClubCard
                  key={club._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => handleClubClick(club._id)}
                >
                  <ClubHeader>
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
                    </ClubInfo>
                    {club.role === 'owner' && (
                      <RoleBadge>
                        <Crown size={14} />
                        Owner
                      </RoleBadge>
                    )}
                  </ClubHeader>

                  <ClubDescription>{club.description}</ClubDescription>

                  <ClubFooter>
                    <ClubStat>
                      <Users size={16} />
                      {club.memberCount} members
                    </ClubStat>
                    <ViewButton>
                      View Details
                      <ChevronRight size={16} />
                    </ViewButton>
                  </ClubFooter>
                </ClubCard>
              ))}
            </ClubsGrid>
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
`

const MainContent = styled.main`
  margin-left: 280px;
  padding: 2rem;
  position: relative;
  z-index: 1;
  min-height: 100vh;
`

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  margin-bottom: 2rem;
`

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

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 4rem 0;
  font-size: 1.125rem;
`

const EmptyState = styled(motion.div)`
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
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const EmptyText = styled.p`
  max-width: 500px;
  line-height: 1.6;
  margin: 0;
`

const JoinButton = styled.button`
  margin-top: 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4);
  }
`

const ClubsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`

const ClubCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
  }
`

const ClubHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`

const ClubLogo = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
`

const ClubLogoPlaceholder = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
`

const ClubInfo = styled.div`
  flex: 1;
`

const ClubName = styled.h3`
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`

const ClubCategory = styled.div`
  color: rgba(139, 92, 246, 1);
  font-size: 0.875rem;
  font-weight: 500;
`

const RoleBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
`

const ClubDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const ClubFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const ClubStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  
  svg {
    color: rgba(139, 92, 246, 0.8);
  }
`

const ViewButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(139, 92, 246, 1);
  font-size: 0.875rem;
  font-weight: 600;
  transition: gap 0.2s;

  ${ClubCard}:hover & {
    gap: 0.5rem;
  }
`

export default Memberships
