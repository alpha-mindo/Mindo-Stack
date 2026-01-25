import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, Settings, Calendar, MessageSquare, 
  UserPlus, UserMinus, Crown, Shield, Edit, Trash2, Plus 
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import FormBuilder, { FormQuestion } from '../components/FormBuilder'

interface Club {
  _id: string
  name: string
  description: string
  logo?: string
  category: string
  tags: string[]
  memberCount: number
  applicationForm: {
    isOpen: boolean
    questions: FormQuestion[]
  }
}

interface Member {
  _id: string
  userId: {
    _id: string
    username: string
    email: string
    profilePicture?: string
  }
  role: string
  status: string
  joinedAt: string
}

function ClubManage() {
  const navigate = useNavigate()
  const { clubId } = useParams<{ clubId: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'announcements' | 'settings'>('overview')
  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clubId) {
      fetchClubData()
      fetchMembers()
    }
  }, [clubId])

  const fetchClubData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch club')
      
      const data = await response.json()
      setClub(data.club)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch members')
      
      const data = await response.json()
      setMembers(data.members || [])
    } catch (err: any) {
      console.error('Error fetching members:', err)
    }
  }

  const handleUpdateClub = async (updates: Partial<Club>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update club')
      
      const data = await response.json()
      setClub(data.club)
      alert('Club updated successfully!')
    } catch (err: any) {
      alert('Error updating club: ' + err.message)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to remove member')
      
      fetchMembers()
      alert('Member removed successfully!')
    } catch (err: any) {
      alert('Error removing member: ' + err.message)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <LoadingContainer>Loading club management...</LoadingContainer>
        </MainContent>
      </PageContainer>
    )
  }

  if (error || !club) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <ErrorContainer>
            <p>{error || 'Club not found'}</p>
            <BackButton onClick={() => navigate('/clubs')}>Back to Clubs</BackButton>
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
          <Header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BackButton onClick={() => navigate(`/clubs/${clubId}`)}>
              <ArrowLeft size={20} />
              Back to Club
            </BackButton>
            <TitleSection>
              <Title>Manage {club.name}</Title>
              <Subtitle>Club Administration</Subtitle>
            </TitleSection>
          </Header>

          <TabContainer>
            <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              <Settings size={18} />
              Overview
            </Tab>
            <Tab $active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
              <Users size={18} />
              Members ({members.length})
            </Tab>
            <Tab $active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
              <Calendar size={18} />
              Events
            </Tab>
            <Tab $active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')}>
              <MessageSquare size={18} />
              Announcements
            </Tab>
            <Tab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              <Settings size={18} />
              Settings
            </Tab>
          </TabContainer>

          <ContentCard>
            {activeTab === 'overview' && (
              <TabContent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SectionTitle>Club Statistics</SectionTitle>
                <StatsGrid>
                  <StatCard>
                    <StatIcon><Users size={24} /></StatIcon>
                    <StatValue>{club.memberCount}</StatValue>
                    <StatLabel>Total Members</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon><Calendar size={24} /></StatIcon>
                    <StatValue>0</StatValue>
                    <StatLabel>Upcoming Events</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon><MessageSquare size={24} /></StatIcon>
                    <StatValue>0</StatValue>
                    <StatLabel>Announcements</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon><UserPlus size={24} /></StatIcon>
                    <StatValue>0</StatValue>
                    <StatLabel>Pending Applications</StatLabel>
                  </StatCard>
                </StatsGrid>

                <SectionTitle style={{ marginTop: '2rem' }}>Application Form</SectionTitle>
                <FormToggle>
                  <ToggleLabel>
                    <input
                      type="checkbox"
                      checked={club.applicationForm.isOpen}
                      onChange={(e) => handleUpdateClub({
                        applicationForm: {
                          ...club.applicationForm,
                          isOpen: e.target.checked
                        }
                      })}
                    />
                    <span>Accept new applications</span>
                  </ToggleLabel>
                </FormToggle>

                {club.applicationForm.isOpen && (
                  <FormBuilderSection>
                    <FormBuilder
                      questions={club.applicationForm.questions}
                      onChange={(questions) => handleUpdateClub({
                        applicationForm: {
                          ...club.applicationForm,
                          questions
                        }
                      })}
                    />
                  </FormBuilderSection>
                )}
              </TabContent>
            )}

            {activeTab === 'members' && (
              <TabContent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SectionTitle>Club Members</SectionTitle>
                <MembersList>
                  {members.map((member) => (
                    <MemberCard key={member._id}>
                      <MemberInfo>
                        {member.userId.profilePicture ? (
                          <MemberAvatar src={`http://localhost:5000${member.userId.profilePicture}`} />
                        ) : (
                          <MemberAvatarPlaceholder>
                            {member.userId.username[0].toUpperCase()}
                          </MemberAvatarPlaceholder>
                        )}
                        <MemberDetails>
                          <MemberName>{member.userId.username}</MemberName>
                          <MemberEmail>{member.userId.email}</MemberEmail>
                          <MemberMeta>
                            <RoleBadge $role={member.role}>
                              {member.role === 'president' && <Crown size={14} />}
                              {member.role === 'vice_president' && <Shield size={14} />}
                              {member.role}
                            </RoleBadge>
                            <JoinDate>Joined {new Date(member.joinedAt).toLocaleDateString()}</JoinDate>
                          </MemberMeta>
                        </MemberDetails>
                      </MemberInfo>
                      {member.role !== 'president' && (
                        <MemberActions>
                          <ActionButton onClick={() => handleRemoveMember(member._id)} $danger>
                            <UserMinus size={16} />
                            Remove
                          </ActionButton>
                        </MemberActions>
                      )}
                    </MemberCard>
                  ))}
                </MembersList>
              </TabContent>
            )}

            {activeTab === 'events' && (
              <TabContent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SectionHeader>
                  <SectionTitle>Events</SectionTitle>
                  <AddButton>
                    <Plus size={16} />
                    Create Event
                  </AddButton>
                </SectionHeader>
                <EmptyState>
                  <Calendar size={48} />
                  <EmptyText>No events yet</EmptyText>
                  <EmptySubtext>Create your first event to get started</EmptySubtext>
                </EmptyState>
              </TabContent>
            )}

            {activeTab === 'announcements' && (
              <TabContent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SectionHeader>
                  <SectionTitle>Announcements</SectionTitle>
                  <AddButton>
                    <Plus size={16} />
                    New Announcement
                  </AddButton>
                </SectionHeader>
                <EmptyState>
                  <MessageSquare size={48} />
                  <EmptyText>No announcements yet</EmptyText>
                  <EmptySubtext>Create announcements to keep members informed</EmptySubtext>
                </EmptyState>
              </TabContent>
            )}

            {activeTab === 'settings' && (
              <TabContent
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SectionTitle>Club Settings</SectionTitle>
                <SettingsForm>
                  <FormGroup>
                    <Label>Club Name</Label>
                    <Input
                      value={club.name}
                      onChange={(e) => setClub({ ...club, name: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Description</Label>
                    <TextArea
                      value={club.description}
                      onChange={(e) => setClub({ ...club, description: e.target.value })}
                      rows={4}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Category</Label>
                    <Select
                      value={club.category}
                      onChange={(e) => setClub({ ...club, category: e.target.value })}
                    >
                      <option value="Sports">Sports</option>
                      <option value="Academic">Academic</option>
                      <option value="Social">Social</option>
                      <option value="Professional">Professional</option>
                      <option value="Arts">Arts</option>
                      <option value="Technology">Technology</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Music">Music</option>
                      <option value="Business">Business</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormGroup>
                  <ButtonGroup>
                    <SaveButton onClick={() => handleUpdateClub(club)}>
                      Save Changes
                    </SaveButton>
                    <DeleteButton>
                      <Trash2 size={16} />
                      Delete Club
                    </DeleteButton>
                  </ButtonGroup>
                </SettingsForm>
              </TabContent>
            )}
          </ContentCard>
        </ContentWrapper>
      </MainContent>
    </PageContainer>
  )
}

// Styled Components
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
  margin-bottom: 2rem;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9375rem;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: color 0.2s ease;

  &:hover {
    color: #a78bfa;
  }
`

const TitleSection = styled.div``

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const Subtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0 0 0;
`

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
`

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${props => props.$active ? 'rgba(99, 102, 241, 0.1)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#6366f1' : 'transparent'};
  color: ${props => props.$active ? '#a78bfa' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: #a78bfa;
    background: rgba(99, 102, 241, 0.05);
  }
`

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);
`

const TabContent = styled(motion.div)`
  min-height: 400px;
`

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1.5rem 0;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const StatIcon = styled.div`
  color: #a78bfa;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
`

const FormToggle = styled.div`
  margin-bottom: 1.5rem;
`

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`

const FormBuilderSection = styled.div`
  margin-top: 1.5rem;
`

const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const MemberCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const MemberAvatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.3);
`

const MemberAvatarPlaceholder = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
`

const MemberDetails = styled.div``

const MemberName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
`

const MemberEmail = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
`

const MemberMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const RoleBadge = styled.div<{ $role: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: ${props => {
    if (props.$role === 'president') return 'rgba(251, 191, 36, 0.2)'
    if (props.$role === 'vice_president') return 'rgba(168, 85, 247, 0.2)'
    return 'rgba(99, 102, 241, 0.2)'
  }};
  border: 1px solid ${props => {
    if (props.$role === 'president') return 'rgba(251, 191, 36, 0.3)'
    if (props.$role === 'vice_president') return 'rgba(168, 85, 247, 0.3)'
    return 'rgba(99, 102, 241, 0.3)'
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$role === 'president') return '#fbbf24'
    if (props.$role === 'vice_president') return '#a855f7'
    return '#a78bfa'
  }};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
`

const JoinDate = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`

const MemberActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'};
  border: 1px solid ${props => props.$danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'};
  border-radius: 8px;
  color: ${props => props.$danger ? '#fca5a5' : '#a78bfa'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'};
  }
`

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.4);
`

const EmptyText = styled.div`
  font-size: 1.125rem;
  font-weight: 500;
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.6);
`

const EmptySubtext = styled.div`
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
`

const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FormGroup = styled.div``

const Label = styled.label`
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9375rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: rgba(15, 23, 42, 1);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const SaveButton = styled.button`
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
`

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: rgba(255, 255, 255, 0.6);
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;
`

export default ClubManage
