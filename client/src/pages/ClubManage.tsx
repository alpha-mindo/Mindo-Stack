import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, Settings, Calendar, MessageSquare, 
  UserPlus, UserMinus, Crown, Shield, Trash2, Plus,
  MapPin, X
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import FormBuilder, { FormQuestion } from '../components/FormBuilder'
import { API_URL } from '../config'

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

interface Event {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  capacity?: number
  signups: string[]
}

interface Announcement {
  _id: string
  title: string
  content: string
  type: 'announcement' | 'poll' | 'form'
  announcerName: string
  createdAt: string
  isPinned: boolean
}

function ClubManage() {
  const navigate = useNavigate()
  const { clubId } = useParams<{ clubId: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'announcements' | 'settings'>('overview')
  const [club, setClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    capacity: ''
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'announcement' as 'announcement' | 'poll' | 'form'
  })

  useEffect(() => {
    if (clubId) {
      fetchClubData()
      fetchMembers()
      fetchEvents()
      fetchAnnouncements()
    }
  }, [clubId])

  const fetchClubData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}`, {
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
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/members`, {
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

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.trips || [])
      }
    } catch (err: any) {
      console.error('Error fetching events:', err)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (err: any) {
      console.error('Error fetching announcements:', err)
    }
  }

  const handleUpdateClub = async (updates: Partial<Club>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}`, {
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
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/members/${memberId}`, {
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

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update member role')
      
      fetchMembers()
      alert('Member role updated successfully!')
    } catch (err: any) {
      alert('Error updating member role: ' + err.message)
    }
  }

  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eventForm,
          capacity: eventForm.capacity ? parseInt(eventForm.capacity) : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create event')
      
      setShowEventModal(false)
      setEventForm({ name: '', description: '', startDate: '', endDate: '', location: '', capacity: '' })
      fetchEvents()
      alert('Event created successfully!')
    } catch (err: any) {
      alert('Error creating event: ' + err.message)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/trips/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete event')
      
      fetchEvents()
      alert('Event deleted successfully!')
    } catch (err: any) {
      alert('Error deleting event: ' + err.message)
    }
  }

  const handleCreateAnnouncement = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementForm)
      })

      if (!response.ok) throw new Error('Failed to create announcement')
      
      setShowAnnouncementModal(false)
      setAnnouncementForm({ title: '', content: '', type: 'announcement' })
      fetchAnnouncements()
      alert('Announcement created successfully!')
    } catch (err: any) {
      alert('Error creating announcement: ' + err.message)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete announcement')
      
      fetchAnnouncements()
      alert('Announcement deleted successfully!')
    } catch (err: any) {
      alert('Error deleting announcement: ' + err.message)
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
                <SectionTitle>Quick Actions</SectionTitle>
                <QuickActionsGrid>
                  <QuickActionCard onClick={() => navigate(`/clubs/${clubId}/events/manage`)}>
                    <Calendar size={32} />
                    <h3>Manage Events</h3>
                    <p>Create, edit, and delete club events</p>
                  </QuickActionCard>
                  <QuickActionCard onClick={() => navigate(`/clubs/${clubId}/content/manage`)}>
                    <MessageSquare size={32} />
                    <h3>Manage Content</h3>
                    <p>Upload and organize club files</p>
                  </QuickActionCard>
                  <QuickActionCard onClick={() => setActiveTab('members')}>
                    <Users size={32} />
                    <h3>Manage Members</h3>
                    <p>View and manage member roles</p>
                  </QuickActionCard>
                  <QuickActionCard onClick={() => setActiveTab('settings')}>
                    <Settings size={32} />
                    <h3>Club Settings</h3>
                    <p>Update club information</p>
                  </QuickActionCard>
                </QuickActionsGrid>

                <SectionTitle>Club Statistics</SectionTitle>
                <StatsGrid>
                  <StatCard>
                    <StatIcon><Users size={24} /></StatIcon>
                    <StatValue>{club.memberCount}</StatValue>
                    <StatLabel>Total Members</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon><Calendar size={24} /></StatIcon>
                    <StatValue>{events.length}</StatValue>
                    <StatLabel>Upcoming Events</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon><MessageSquare size={24} /></StatIcon>
                    <StatValue>{announcements.length}</StatValue>
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
                          <MemberAvatar src={`${API_URL}${member.userId.profilePicture}`} />
                        ) : (
                          <MemberAvatarPlaceholder>
                            {member.userId.username[0].toUpperCase()}
                          </MemberAvatarPlaceholder>
                        )}
                        <MemberDetails>
                          <MemberName>{member.userId.username}</MemberName>
                          <MemberEmail>{member.userId.email}</MemberEmail>
                          <MemberMeta>
                            {member.role === 'president' ? (
                              <RoleBadge $role={member.role}>
                                <Crown size={14} />
                                president
                              </RoleBadge>
                            ) : (
                              <RoleSelector
                                value={member.role}
                                onChange={(e) => handleUpdateMemberRole(member._id, e.target.value)}
                              >
                                <option value="member">Member</option>
                                <option value="vice_president">Vice President</option>
                                <option value="treasurer">Treasurer</option>
                                <option value="secretary">Secretary</option>
                                <option value="moderator">Moderator</option>
                              </RoleSelector>
                            )}
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
                  <AddButton onClick={() => setShowEventModal(true)}>
                    <Plus size={16} />
                    Create Event
                  </AddButton>
                </SectionHeader>
                {events.length === 0 ? (
                  <EmptyState>
                    <Calendar size={48} />
                    <EmptyText>No events yet</EmptyText>
                    <EmptySubtext>Create your first event to get started</EmptySubtext>
                  </EmptyState>
                ) : (
                  <EventsList>
                    {events.map((event) => (
                      <EventCard key={event._id}>
                        <EventHeader>
                          <EventTitle>{event.name}</EventTitle>
                          <DeleteButton onClick={() => handleDeleteEvent(event._id)}>
                            <Trash2 size={16} />
                          </DeleteButton>
                        </EventHeader>
                        <EventDescription>{event.description}</EventDescription>
                        <EventMeta>
                          <EventMetaItem>
                            <Calendar size={14} />
                            {new Date(event.startDate).toLocaleDateString()}
                          </EventMetaItem>
                          <EventMetaItem>
                            <MapPin size={14} />
                            {event.location}
                          </EventMetaItem>
                          <EventMetaItem>
                            <Users size={14} />
                            {event.signups?.length || 0} signed up
                          </EventMetaItem>
                        </EventMeta>
                      </EventCard>
                    ))}
                  </EventsList>
                )}
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
                  <AddButton onClick={() => setShowAnnouncementModal(true)}>
                    <Plus size={16} />
                    New Announcement
                  </AddButton>
                </SectionHeader>
                {announcements.length === 0 ? (
                  <EmptyState>
                    <MessageSquare size={48} />
                    <EmptyText>No announcements yet</EmptyText>
                    <EmptySubtext>Create announcements to keep members informed</EmptySubtext>
                  </EmptyState>
                ) : (
                  <AnnouncementsList>
                    {announcements.map((announcement) => (
                      <AnnouncementCard key={announcement._id}>
                        <AnnouncementHeader>
                          <div>
                            <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                            <AnnouncementMeta>
                              By {announcement.announcerName} • {new Date(announcement.createdAt).toLocaleDateString()}
                            </AnnouncementMeta>
                          </div>
                          <DeleteButton onClick={() => handleDeleteAnnouncement(announcement._id)}>
                            <Trash2 size={16} />
                          </DeleteButton>
                        </AnnouncementHeader>
                        <AnnouncementContent>{announcement.content}</AnnouncementContent>
                        {announcement.isPinned && <PinnedBadge>Pinned</PinnedBadge>}
                      </AnnouncementCard>
                    ))}
                  </AnnouncementsList>
                )}
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

      {/* Event Modal */}
      {showEventModal && (
        <Modal onClick={() => setShowEventModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create New Event</ModalTitle>
              <CloseButton onClick={() => setShowEventModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Event Name</Label>
                <Input
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="e.g., Annual Gala"
                />
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={3}
                />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label>Location</Label>
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g., Main Auditorium"
                />
              </FormGroup>
              <FormGroup>
                <Label>Capacity (optional)</Label>
                <Input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                  placeholder="Maximum attendees"
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowEventModal(false)}>Cancel</CancelButton>
              <SubmitButton onClick={handleCreateEvent}>Create Event</SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <Modal onClick={() => setShowAnnouncementModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>New Announcement</ModalTitle>
              <CloseButton onClick={() => setShowAnnouncementModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Title</Label>
                <Input
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </FormGroup>
              <FormGroup>
                <Label>Content</Label>
                <TextArea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={5}
                />
              </FormGroup>
              <FormGroup>
                <Label>Type</Label>
                <Select
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as any })}
                >
                  <option value="announcement">Announcement</option>
                  <option value="poll">Poll</option>
                  <option value="form">Form</option>
                </Select>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowAnnouncementModal(false)}>Cancel</CancelButton>
              <SubmitButton onClick={handleCreateAnnouncement}>Post Announcement</SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
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

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
`

const QuickActionCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.1);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
  }

  svg {
    color: #a78bfa;
    margin-bottom: 1rem;
  }

  h3 {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.4;
  }
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

const RoleSelector = styled.select`
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: rgba(15, 23, 42, 1);
    color: #ffffff;
  }
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

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`

const EventCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(139, 92, 246, 0.3);
  }
`

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`

const EventTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`

const EventDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`

const EventMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`

const EventMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;

  svg {
    color: rgba(139, 92, 246, 0.8);
  }
`

const AnnouncementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`

const AnnouncementCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(139, 92, 246, 0.3);
  }
`

const AnnouncementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`

const AnnouncementTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`

const AnnouncementMeta = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
`

const AnnouncementContent = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
`

const PinnedBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(168, 85, 247, 1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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
  max-height: 90vh;
  overflow: auto;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ModalTitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

export default ClubManage
