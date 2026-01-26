import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Users, BarChart3, Ticket, Building2, Shield, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface Stats {
  totalUsers: number
  totalClubs: number
  totalTickets: number
  openTickets: number
  adminCount: number
  recentUsers: number
}

interface User {
  _id: string
  username: string
  email: string
  isAdmin: boolean
  createdAt: string
}

interface Ticket {
  _id: string
  subject: string
  status: string
  priority: string
  category: string
  userId: {
    username: string
  }
  createdAt: string
}

interface Club {
  _id: string
  name: string
  description: string
  category: string
  memberCount: number
  createdAt: string
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    else if (activeTab === 'tickets') fetchTickets()
    else if (activeTab === 'clubs') fetchClubs()
  }, [activeTab])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/users?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
    }
  }

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/clubs?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setClubs(data.clubs)
      }
    } catch (err) {
      console.error('Error fetching clubs:', err)
    }
  }

  const handleToggleAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to toggle admin status?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      alert('Error updating admin status')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      alert('Error deleting user')
    }
  }

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchClubs()
      }
    } catch (err) {
      alert('Error deleting club')
    }
  }

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchTickets()
      }
    } catch (err) {
      alert('Error updating ticket status')
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
            <Title>
              <Shield size={32} />
              Admin Dashboard
            </Title>
            <Subtitle>Manage users, tickets, and clubs</Subtitle>
          </Header>

          <TabsContainer>
            <Tab $active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
              <BarChart3 size={16} />
              Statistics
            </Tab>
            <Tab $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              <Users size={16} />
              Users
            </Tab>
            <Tab $active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')}>
              <Ticket size={16} />
              Tickets
            </Tab>
            <Tab $active={activeTab === 'clubs'} onClick={() => setActiveTab('clubs')}>
              <Building2 size={16} />
              Clubs
            </Tab>
          </TabsContainer>

          {loading ? (
            <LoadingText>Loading...</LoadingText>
          ) : (
            <>
              {activeTab === 'stats' && stats && (
                <StatsGrid>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
                      <Users size={24} />
                    </StatIcon>
                    <StatValue>{stats.totalUsers}</StatValue>
                    <StatLabel>Total Users</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
                      <Building2 size={24} />
                    </StatIcon>
                    <StatValue>{stats.totalClubs}</StatValue>
                    <StatLabel>Total Clubs</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                      <Ticket size={24} />
                    </StatIcon>
                    <StatValue>{stats.totalTickets}</StatValue>
                    <StatLabel>Total Tickets</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                      <Ticket size={24} />
                    </StatIcon>
                    <StatValue>{stats.openTickets}</StatValue>
                    <StatLabel>Open Tickets</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                      <Shield size={24} />
                    </StatIcon>
                    <StatValue>{stats.adminCount}</StatValue>
                    <StatLabel>Admins</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      <Users size={24} />
                    </StatIcon>
                    <StatValue>{stats.recentUsers}</StatValue>
                    <StatLabel>New Users (7d)</StatLabel>
                  </StatCard>
                </StatsGrid>
              )}

              {activeTab === 'users' && (
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Username</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>Joined</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <Td>{user.username}</Td>
                          <Td>{user.email}</Td>
                          <Td>
                            {user.isAdmin ? (
                              <AdminBadge>Admin</AdminBadge>
                            ) : (
                              <UserBadge>User</UserBadge>
                            )}
                          </Td>
                          <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            <ActionButton onClick={() => handleToggleAdmin(user._id)}>
                              {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </ActionButton>
                            <DeleteButton onClick={() => handleDeleteUser(user._id)}>
                              <Trash2 size={14} />
                            </DeleteButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 'tickets' && (
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Subject</Th>
                        <Th>User</Th>
                        <Th>Category</Th>
                        <Th>Priority</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket._id}>
                          <Td>{ticket.subject}</Td>
                          <Td>{ticket.userId.username}</Td>
                          <Td>{ticket.category}</Td>
                          <Td>
                            <PriorityBadge $priority={ticket.priority}>
                              {ticket.priority}
                            </PriorityBadge>
                          </Td>
                          <Td>
                            <Select
                              value={ticket.status}
                              onChange={(e) => handleUpdateTicketStatus(ticket._id, e.target.value)}
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="waiting-on-user">Waiting on User</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </Select>
                          </Td>
                          <Td>{new Date(ticket.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            <ActionButton onClick={() => window.open(`/help/${ticket._id}`, '_blank')}>
                              View
                            </ActionButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 'clubs' && (
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Description</Th>
                        <Th>Category</Th>
                        <Th>Members</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubs.map((club) => (
                        <tr key={club._id}>
                          <Td>{club.name}</Td>
                          <Td>{club.description?.substring(0, 50)}...</Td>
                          <Td>{club.category}</Td>
                          <Td>{club.memberCount}</Td>
                          <Td>{new Date(club.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            <DeleteButton onClick={() => handleDeleteClub(club._id)}>
                              <Trash2 size={14} />
                              Delete
                            </DeleteButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              )}
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0;
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
  font-size: 0.875rem;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`

const StatValue = styled.div`
  color: rgba(255, 255, 255, 0.95);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
`

const TableContainer = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const Td = styled.td`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const AdminBadge = styled.span`
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`

const UserBadge = styled.span`
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`

const PriorityBadge = styled.span<{ $priority: string }>`
  background: ${props => {
    switch (props.$priority) {
      case 'urgent': return 'rgba(239, 68, 68, 0.2)'
      case 'high': return 'rgba(245, 158, 11, 0.2)'
      case 'medium': return 'rgba(59, 130, 246, 0.2)'
      default: return 'rgba(107, 114, 128, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.$priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      default: return '#6b7280'
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
`

const ActionButton = styled.button`
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366f1;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;

  &:hover {
    background: rgba(99, 102, 241, 0.3);
  }
`

const DeleteButton = styled.button`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`

const Select = styled.select`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 2rem;
`

export default AdminDashboard
