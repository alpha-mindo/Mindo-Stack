import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Calendar, MessageSquare, Info, Settings, UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'

interface Club {
  _id: string
  name: string
  description: string
  logo?: string
  category: string
  tags: string[]
  memberCount: number
  ownerId: string
  applicationForm?: {
    isOpen: boolean
    questions: string[]
  }
  createdAt: string
}

interface Member {
  _id: string
  userId: {
    _id: string
    username: string
    profilePicture?: string
  }
  role: string
  joinedAt: string
}

type TabType = 'about' | 'members' | 'events' | 'announcements'

function ClubDetails() {
  const { clubId } = useParams<{ clubId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('about')
  const [isMember, setIsMember] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClubDetails()
  }, [clubId])

  const fetchClubDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch club details
      const clubResponse = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!clubResponse.ok) throw new Error('Failed to fetch club details')
      
      const clubData = await clubResponse.json()
      setClub(clubData.data)
      setIsOwner(clubData.data.ownerId === user?.id)

      // Fetch members
      const membersResponse = await fetch(`http://localhost:5000/api/clubs/${clubId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setMembers(membersData.data || [])
        setIsMember(membersData.data.some((m: Member) => m.userId._id === user?.id))
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClub = async () => {
    // In a real app, this would either join directly or create an application
    navigate(`/clubs/${clubId}/apply`)
  }

  const handleManageClub = () => {
    navigate(`/clubs/${clubId}/manage`)
  }

  if (loading) {
    return (
      <PageContainer>
        <Background>
          <GradientOrb style={{ top: '10%', left: '10%' }} />
          <GradientOrb style={{ top: '60%', right: '15%' }} />
          <GridPattern />
        </Background>
        <Navbar />
        <Notifications />
        <MainContent>
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        </MainContent>
      </PageContainer>
    )
  }

  if (error || !club) {
    return (
      <PageContainer>
        <Background>
          <GradientOrb style={{ top: '10%', left: '10%' }} />
          <GridPattern />
        </Background>
        <Navbar />
        <Notifications />
        <MainContent>
          <ErrorContainer>
            <ErrorMessage>Club not found or you don't have permission to view it.</ErrorMessage>
            <BackButton onClick={() => navigate('/discover')}>
              <ArrowLeft size={20} />
              Back to Discover
            </BackButton>
          </ErrorContainer>
        </MainContent>
      </PageContainer>
    )
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
          <BackButtonTop onClick={() => navigate('/discover')}>
            <ArrowLeft size={20} />
            Back to Discover
          </BackButtonTop>

          <ClubHeader
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ClubInfo>
              {club.logo ? (
                <ClubLogo src={`http://localhost:5000${club.logo}`} alt={club.name} />
              ) : (
                <ClubLogoPlaceholder>
                  {club.name.charAt(0).toUpperCase()}
                </ClubLogoPlaceholder>
              )}
              <ClubTitleSection>
                <ClubTitle>{club.name}</ClubTitle>
                <ClubMeta>
                  <CategoryBadge>{club.category}</CategoryBadge>
                  <MetaItem>
                    <Users size={16} />
                    {club.memberCount} members
                  </MetaItem>
                </ClubMeta>
              </ClubTitleSection>
            </ClubInfo>
            <ActionButtons>
              {isOwner && (
                <ManageButton
                  onClick={handleManageClub}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings size={18} />
                  Manage Club
                </ManageButton>
              )}
              {!isMember && !isOwner && (
                <JoinButton
                  onClick={handleJoinClub}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserPlus size={18} />
                  {club.applicationForm?.isOpen ? 'Apply to Join' : 'Join Club'}
                </JoinButton>
              )}
              {isMember && !isOwner && (
                <MemberBadge>
                  <CheckCircle size={18} />
                  Member
                </MemberBadge>
              )}
            </ActionButtons>
          </ClubHeader>

          <TabsContainer>
            <Tab
              $isActive={activeTab === 'about'}
              onClick={() => setActiveTab('about')}
            >
              <Info size={18} />
              About
            </Tab>
            <Tab
              $isActive={activeTab === 'members'}
              onClick={() => setActiveTab('members')}
            >
              <Users size={18} />
              Members
            </Tab>
            <Tab
              $isActive={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={18} />
              Events
            </Tab>
            <Tab
              $isActive={activeTab === 'announcements'}
              onClick={() => setActiveTab('announcements')}
            >
              <MessageSquare size={18} />
              Announcements
            </Tab>
          </TabsContainer>

          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeTab}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'about' && (
              <AboutSection>
                <SectionTitle>About this club</SectionTitle>
                <Description>{club.description}</Description>
                
                {club.tags && club.tags.length > 0 && (
                  <>
                    <SectionTitle>Tags</SectionTitle>
                    <TagList>
                      {club.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </TagList>
                  </>
                )}

                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>Created</InfoLabel>
                    <InfoValue>{new Date(club.createdAt).toLocaleDateString()}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Category</InfoLabel>
                    <InfoValue>{club.category}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Applications</InfoLabel>
                    <InfoValue>{club.applicationForm?.isOpen ? 'Open' : 'Closed'}</InfoValue>
                  </InfoCard>
                </InfoGrid>
              </AboutSection>
            )}

            {activeTab === 'members' && (
              <MembersSection>
                <SectionTitle>{members.length} Members</SectionTitle>
                <MembersList>
                  {members.map(member => (
                    <MemberCard key={member._id}>
                      {member.userId.profilePicture ? (
                        <MemberAvatar src={`http://localhost:5000${member.userId.profilePicture}`} alt={member.userId.username} />
                      ) : (
                        <MemberAvatarPlaceholder>
                          <Users size={20} />
                        </MemberAvatarPlaceholder>
                      )}
                      <MemberInfo>
                        <MemberName>{member.userId.username}</MemberName>
                        <MemberRole>{member.role}</MemberRole>
                      </MemberInfo>
                    </MemberCard>
                  ))}
                </MembersList>
              </MembersSection>
            )}

            {activeTab === 'events' && (
              <PlaceholderSection>
                <PlaceholderIcon><Calendar size={48} /></PlaceholderIcon>
                <PlaceholderText>No events yet</PlaceholderText>
                <PlaceholderSubtext>Check back later for upcoming events</PlaceholderSubtext>
              </PlaceholderSection>
            )}

            {activeTab === 'announcements' && (
              <PlaceholderSection>
                <PlaceholderIcon><MessageSquare size={48} /></PlaceholderIcon>
                <PlaceholderText>No announcements yet</PlaceholderText>
                <PlaceholderSubtext>Stay tuned for updates from this club</PlaceholderSubtext>
              </PlaceholderSection>
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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
`

const ErrorMessage = styled.div`
  color: #fca5a5;
  font-size: 1.125rem;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const BackButtonTop = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9375rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #a78bfa;
  }
`

const ClubHeader = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
`

const ClubInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
`

const ClubLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.3);
`

const ClubLogoPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
`

const ClubTitleSection = styled.div`
  flex: 1;
`

const ClubTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`

const ClubMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`

const CategoryBadge = styled.span`
  padding: 0.375rem 0.75rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.875rem;
  font-weight: 500;
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9375rem;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`

const JoinButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
`

const ManageButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
`

const MemberBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #4ade80;
  font-size: 0.9375rem;
  font-weight: 500;
`

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
`

const Tab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${props => props.$isActive ? '#6366f1' : 'transparent'};
  color: ${props => props.$isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: #ffffff;
  }
`

const TabContent = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);
  min-height: 400px;
`

const AboutSection = styled.div``

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
`

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0 0 2rem 0;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
`

const Tag = styled.span`
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.875rem;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`

const InfoCard = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
`

const InfoValue = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
`

const MembersSection = styled.div``

const MembersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`

const MemberCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const MemberAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.3);
`

const MemberAvatarPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
`

const MemberInfo = styled.div`
  flex: 1;
`

const MemberName = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #ffffff;
`

const MemberRole = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: capitalize;
`

const PlaceholderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
`

const PlaceholderIcon = styled.div`
  color: rgba(255, 255, 255, 0.2);
`

const PlaceholderText = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`

const PlaceholderSubtext = styled.div`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.4);
`

export default ClubDetails
