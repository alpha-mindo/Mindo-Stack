import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Users, Plus, Crown } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'

interface Club {
  _id: string
  name: string
  description: string
  logo?: string
  category: string
  memberCount: number
  isOwner: boolean
}

function Clubs() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/clubs/my-clubs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch clubs')
      
      const data = await response.json()
      setClubs(data.clubs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createClub = () => {
    navigate('/clubs/create')
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
          <Header>
            <HeaderContent
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Title>My Clubs</Title>
              <Subtitle>Manage and explore your clubs</Subtitle>
            </HeaderContent>
            <CreateButton
              onClick={createClub}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Create Club
            </CreateButton>
          </Header>

          <Section>
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading clubs...</LoadingText>
              </LoadingContainer>
            ) : error ? (
              <ErrorMessage>{error}</ErrorMessage>
            ) : clubs.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <EmptyIcon>
                  <Users size={64} />
                </EmptyIcon>
                <EmptyTitle>No Clubs Yet</EmptyTitle>
                <EmptyText>Join clubs to connect with others or create your own club</EmptyText>
                <CreateButton onClick={createClub} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Plus size={20} />
                  Create Your First Club
                </CreateButton>
              </EmptyState>
            ) : (
              <ClubsGrid>
                {clubs.map((club, index) => (
                  <ClubCard
                    key={club._id}
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    {club.logo ? (
                      <ClubLogo src={club.logo} alt={club.name} />
                    ) : (
                      <ClubLogoPlaceholder>
                        <Users size={40} />
                      </ClubLogoPlaceholder>
                    )}
                    <ClubContent>
                      <ClubHeader>
                        <ClubName>{club.name}</ClubName>
                        {club.isOwner && (
                          <OwnerBadge>
                            <Crown size={12} />
                            Owner
                          </OwnerBadge>
                        )}
                      </ClubHeader>
                      <ClubDescription>{club.description}</ClubDescription>
                      <ClubFooter>
                        <CategoryTag>{club.category}</CategoryTag>
                        <MemberCount>{club.memberCount} members</MemberCount>
                      </ClubFooter>
                    </ClubContent>
                  </ClubCard>
                ))}
              </ClubsGrid>
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
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`

const HeaderContent = styled(motion.div)`
  flex: 1;
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

const CreateButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
  }
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
  margin: 0 0 2rem 0;
  max-width: 400px;
`

const ClubsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`

const ClubCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.2);
  }
`

const ClubLogo = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`

const ClubLogoPlaceholder = styled.div`
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  color: rgba(255, 255, 255, 0.4);
`

const ClubContent = styled.div`
  padding: 1.5rem;
`

const ClubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`

const ClubName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  flex: 1;
`

const OwnerBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(168, 139, 250, 0.15);
  border: 1px solid rgba(168, 139, 250, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a78bfa;
  text-transform: uppercase;
`

const ClubDescription = styled.p`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const ClubFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const CategoryTag = styled.span`
  padding: 0.375rem 0.875rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #818cf8;
  text-transform: capitalize;
`

const MemberCount = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
`

export default Clubs
