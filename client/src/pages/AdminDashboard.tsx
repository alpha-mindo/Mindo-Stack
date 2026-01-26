import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Users, BarChart3, Ticket, Building2, Shield, Trash2, AlertTriangle, Ban, CheckCircle, Clock, UserPlus, Search } from 'lucide-react'
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
  suspendedClubs: number
  unresolvedViolations: number
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
  isSuspended: boolean
  violationCount: number
  suspensionEndDate?: string
  suspensionReason?: string
  createdAt: string
  category: string
  memberCount: number
}

interface Violation {
  _id: string
  club: {
    _id: string
    name: string
  }
  issuedBy: {
    username: string
  }
  violationType: string
  severity: string
  description: string
  action: string
  resolved: boolean
  createdAt: string
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [showSuspensionModal, setShowSuspensionModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false
  })
  const [violationForm, setViolationForm] = useState({
    violationType: 'Inappropriate Content',
    severity: 'medium',
    description: '',
    action: 'warning',
    suspensionDays: '7'
  })
  const [suspensionForm, setSuspensionForm] = useState({
    suspensionDays: '7',
    reason: ''
  })

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    else if (activeTab === 'tickets') fetchTickets()
    else if (activeTab === 'clubs') fetchClubs()
    else if (activeTab === 'violations') fetchViolations()
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

  const fetchViolations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/violations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setViolations(data.violations)
      }
    } catch (err) {
      console.error('Error fetching violations:', err)
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
        alert('User deleted successfully')
      }
    } catch (err) {
      alert('Error deleting user')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createUserForm.username || !createUserForm.email || !createUserForm.password) {
      alert('Please fill in all fields')
      return
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
    if (!passwordRegex.test(createUserForm.password)) {
      alert('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createUserForm)
      })

      const data = await response.json()

      if (response.ok) {
        alert('User created successfully')
        setShowCreateUserModal(false)
        setCreateUserForm({ username: '', email: '', password: '', isAdmin: false })
        fetchUsers()
      } else {
        alert(data.message || 'Error creating user')
      }
    } catch (err) {
      alert('Error creating user')
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

  const handleIssueViolation = async () => {
    if (!selectedClub) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/clubs/${selectedClub._id}/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(violationForm)
      })

      if (response.ok) {
        setShowViolationModal(false)
        setViolationForm({
          violationType: 'Inappropriate Content',
          severity: 'medium',
          description: '',
          action: 'warning',
          suspensionDays: '7'
        })
        fetchClubs()
        fetchViolations()
        alert('Violation issued successfully')
      }
    } catch (err) {
      alert('Error issuing violation')
    }
  }

  const handleUnsuspendClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to unsuspend this club?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/clubs/${clubId}/unsuspend`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchClubs()
        alert('Club unsuspended successfully')
      }
    } catch (err) {
      alert('Error unsuspending club')
    }
  }

  const handleResolveViolation = async (violationId: string) => {
    const notes = prompt('Resolution notes (optional):')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/violations/${violationId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolutionNotes: notes })
      })

      if (response.ok) {
        fetchViolations()
        alert('Violation resolved')
      }
    } catch (err) {
      alert('Error resolving violation')
    }
  }

  const openViolationModal = (club: Club) => {
    setSelectedClub(club)
    setShowViolationModal(true)
  }

  const openSuspensionModal = (club: Club) => {
    setSelectedClub(club)
    // Pre-fill with remaining days from current suspension
    if (club.suspensionEndDate) {
      const daysRemaining = Math.ceil(
        (new Date(club.suspensionEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      setSuspensionForm({
        suspensionDays: Math.max(1, daysRemaining).toString(),
        reason: club.suspensionReason || ''
      })
    }
    setShowSuspensionModal(true)
  }

  const handleUpdateSuspension = async () => {
    if (!selectedClub) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/clubs/${selectedClub._id}/suspension`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(suspensionForm)
      })

      if (response.ok) {
        setShowSuspensionModal(false)
        setSuspensionForm({ suspensionDays: '7', reason: '' })
        fetchClubs()
        alert('Suspension duration updated successfully')
      }
    } catch (err) {
      alert('Error updating suspension')
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
            <Tab $active={activeTab === 'violations'} onClick={() => setActiveTab('violations')}>
              <AlertTriangle size={16} />
              Violations
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
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>
                      <Ban size={24} />
                    </StatIcon>
                    <StatValue>{stats.suspendedClubs}</StatValue>
                    <StatLabel>Suspended Clubs</StatLabel>
                  </StatCard>
                  <StatCard>
                    <StatIcon style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}>
                      <AlertTriangle size={24} />
                    </StatIcon>
                    <StatValue>{stats.unresolvedViolations}</StatValue>
                    <StatLabel>Active Violations</StatLabel>
                  </StatCard>
                </StatsGrid>
              )}

              {activeTab === 'users' && (
                <>
                  <TableHeader>
                    <SearchContainer>
                      <Search size={18} />
                      <SearchInput
                        type="text"
                        placeholder="Search users by username or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </SearchContainer>
                    <CreateButton onClick={() => setShowCreateUserModal(true)}>
                      <UserPlus size={18} />
                      Create User
                    </CreateButton>
                  </TableHeader>
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
                        {users
                          .filter(user =>
                            user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.email.toLowerCase().includes(userSearch.toLowerCase())
                          )
                          .map((user) => (
                            <tr key={user._id}>
                              <Td>
                                <UserInfo>
                                  <UserAvatar>{user.username.charAt(0).toUpperCase()}</UserAvatar>
                                  <span>{user.username}</span>
                                </UserInfo>
                              </Td>
                              <Td>{user.email}</Td>
                              <Td>
                                {user.isAdmin ? (
                                  <AdminBadge><Shield size={12} /> Admin</AdminBadge>
                                ) : (
                                  <UserBadge>User</UserBadge>
                                )}
                              </Td>
                              <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                              <Td>
                                <ActionsGroup>
                                  <ActionButton onClick={() => handleToggleAdmin(user._id)}>
                                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                  </ActionButton>
                                  <DeleteButton onClick={() => handleDeleteUser(user._id)}>
                                    <Trash2 size={14} />
                                  </DeleteButton>
                                </ActionsGroup>
                              </Td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                    {users.filter(user =>
                      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearch.toLowerCase())
                    ).length === 0 && (
                      <EmptyState>
                        <Users size={48} />
                        <p>No users found</p>
                      </EmptyState>
                    )}
                  </TableContainer>
                </>
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
                        <Th>Status</Th>
                        <Th>Violations</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubs.map((club) => (
                        <tr key={club._id}>
                          <Td>{club.name}</Td>
                          <Td>{club.description?.substring(0, 40)}...</Td>
                          <Td>{club.category}</Td>
                          <Td>{club.memberCount}</Td>
                          <Td>
                            {club.isSuspended ? (
                              <StatusBadge $color="#f59e0b">
                                <Ban size={12} />
                                Suspended
                              </StatusBadge>
                            ) : (
                              <StatusBadge $color="#10b981">
                                Active
                              </StatusBadge>
                            )}
                          </Td>
                          <Td>
                            {club.violationCount > 0 && (
                              <ViolationCount>{club.violationCount}</ViolationCount>
                            )}
                          </Td>
                          <Td>{new Date(club.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            <ActionButton onClick={() => openViolationModal(club)}>
                              <AlertTriangle size={12} />
                              Warn
                            </ActionButton>
                            {club.isSuspended && (
                              <>
                                <ActionButton 
                                  onClick={() => openSuspensionModal(club)} 
                                  style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}
                                >
                                  <Clock size={12} />
                                  Edit
                                </ActionButton>
                                <ActionButton onClick={() => handleUnsuspendClub(club._id)}>
                                  <CheckCircle size={12} />
                                  Unsuspend
                                </ActionButton>
                              </>
                            )}
                            <DeleteButton onClick={() => handleDeleteClub(club._id)}>
                              <Trash2 size={14} />
                            </DeleteButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 'violations' && (
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Club</Th>
                        <Th>Type</Th>
                        <Th>Severity</Th>
                        <Th>Action</Th>
                        <Th>Issued By</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map((violation) => (
                        <tr key={violation._id}>
                          <Td>{violation.club.name}</Td>
                          <Td>{violation.violationType}</Td>
                          <Td>
                            <PriorityBadge $priority={violation.severity}>
                              {violation.severity}
                            </PriorityBadge>
                          </Td>
                          <Td>
                            {violation.action === 'suspension' ? (
                              <StatusBadge $color="#f59e0b">Suspension</StatusBadge>
                            ) : (
                              <StatusBadge $color="#6366f1">Warning</StatusBadge>
                            )}
                          </Td>
                          <Td>{violation.issuedBy.username}</Td>
                          <Td>{new Date(violation.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            {violation.resolved ? (
                              <StatusBadge $color="#10b981">
                                <CheckCircle size={12} />
                                Resolved
                              </StatusBadge>
                            ) : (
                              <StatusBadge $color="#ef4444">
                                Active
                              </StatusBadge>
                            )}
                          </Td>
                          <Td>
                            {!violation.resolved && (
                              <ActionButton onClick={() => handleResolveViolation(violation._id)}>
                                <CheckCircle size={12} />
                                Resolve
                              </ActionButton>
                            )}
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

      {showViolationModal && selectedClub && (
        <Modal onClick={() => setShowViolationModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Issue Violation - {selectedClub.name}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Violation Type</Label>
                <Select 
                  value={violationForm.violationType} 
                  onChange={(e) => setViolationForm({...violationForm, violationType: e.target.value})}
                >
                  <option>Inappropriate Content</option>
                  <option>Spam</option>
                  <option>Harassment</option>
                  <option>Impersonation</option>
                  <option>Terms Violation</option>
                  <option>Illegal Activity</option>
                  <option>Other</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Severity</Label>
                <Select 
                  value={violationForm.severity} 
                  onChange={(e) => setViolationForm({...violationForm, severity: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Action</Label>
                <Select 
                  value={violationForm.action} 
                  onChange={(e) => setViolationForm({...violationForm, action: e.target.value})}
                >
                  <option value="warning">Warning Only</option>
                  <option value="suspension">Suspend Club</option>
                </Select>
              </FormGroup>
              {violationForm.action === 'suspension' && (
                <FormGroup>
                  <Label>Suspension Duration (days)</Label>
                  <Input 
                    type="number" 
                    value={violationForm.suspensionDays}
                    onChange={(e) => setViolationForm({...violationForm, suspensionDays: e.target.value})}
                    min="1"
                  />
                </FormGroup>
              )}
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={violationForm.description}
                  onChange={(e) => setViolationForm({...violationForm, description: e.target.value})}
                  placeholder="Describe the violation and reason for action..."
                  rows={4}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowViolationModal(false)}>Cancel</CancelButton>
              <SubmitButton onClick={handleIssueViolation}>Issue Violation</SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {showSuspensionModal && selectedClub && (
        <Modal onClick={() => setShowSuspensionModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Edit Suspension - {selectedClub.name}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <InfoText>
                <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Current suspension ends on <strong>
                  {selectedClub.suspensionEndDate 
                    ? new Date(selectedClub.suspensionEndDate).toLocaleDateString() 
                    : 'N/A'}
                </strong>
              </InfoText>
              <FormGroup>
                <Label>New Suspension Duration (days)</Label>
                <Input 
                  type="number" 
                  value={suspensionForm.suspensionDays}
                  onChange={(e) => setSuspensionForm({...suspensionForm, suspensionDays: e.target.value})}
                  min="1"
                  placeholder="Number of days from today"
                />
                <HelpText>
                  The suspension will be extended or shortened to end {suspensionForm.suspensionDays} days from today
                </HelpText>
              </FormGroup>
              <FormGroup>
                <Label>Reason (optional)</Label>
                <TextArea
                  value={suspensionForm.reason}
                  onChange={(e) => setSuspensionForm({...suspensionForm, reason: e.target.value})}
                  placeholder="Reason for modifying suspension duration..."
                  rows={3}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowSuspensionModal(false)}>Cancel</CancelButton>
              <SubmitButton onClick={handleUpdateSuspension}>Update Suspension</SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <Modal onClick={() => setShowCreateUserModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <UserPlus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Create New User
              </ModalTitle>
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleCreateUser}>
                <FormGroup>
                  <Label>Username</Label>
                  <Input
                    type="text"
                    value={createUserForm.username}
                    onChange={(e) => setCreateUserForm({...createUserForm, username: e.target.value})}
                    placeholder="Enter username"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                  <HelpText>
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character
                  </HelpText>
                </FormGroup>

                <FormGroup>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={createUserForm.isAdmin}
                      onChange={(e) => setCreateUserForm({...createUserForm, isAdmin: e.target.checked})}
                    />
                    <span>Make this user an admin</span>
                  </CheckboxLabel>
                </FormGroup>

                <ModalFooter>
                  <CancelButton type="button" onClick={() => setShowCreateUserModal(false)}>
                    Cancel
                  </CancelButton>
                  <SubmitButton type="submit">
                    <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Create User
                  </SubmitButton>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
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
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`

const UserBadge = styled.span`
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  flex: 1;
  min-width: 250px;
  max-width: 400px;

  svg {
    color: rgba(255, 255, 255, 0.5);
  }
`

const SearchInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  flex: 1;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const CreateButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`

const ActionsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);

  svg {
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
`



const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`

const PriorityBadge = styled.span<{ $priority: string }>`
  background: ${props => {
    switch (props.$priority) {
      case 'urgent': case 'critical': return 'rgba(239, 68, 68, 0.2)'
      case 'high': return 'rgba(245, 158, 11, 0.2)'
      case 'medium': return 'rgba(59, 130, 246, 0.2)'
      default: return 'rgba(107, 114, 128, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.$priority) {
      case 'urgent': case 'critical': return '#ef4444'
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

const StatusBadge = styled.div<{ $color: string }>`
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: capitalize;
`

const ViolationCount = styled.span`
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
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
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

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
  overflow-y: auto;
`

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ModalTitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const ModalBody = styled.div`
  padding: 1.5rem;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(139, 92, 246, 0.5);
  }
`

const InfoText = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: rgba(59, 130, 246, 1);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
`

const HelpText = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin-top: 0.5rem;
  font-style: italic;
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
`

export default AdminDashboard
