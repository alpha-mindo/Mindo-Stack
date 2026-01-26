import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Mail, Check, X, Clock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Invitation {
  _id: string;
  club: {
    _id: string;
    name: string;
    logo?: string;
    category: string;
  };
  invitedBy: {
    _id: string;
    username: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
}

export default function Invitations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInvitations();
  }, [user, navigate]);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/my-invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch invitations');
      
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to accept invitation');
      
      await fetchInvitations();
      alert('Invitation accepted! You are now a member of the club.');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to decline invitation');
      
      await fetchInvitations();
      alert('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation');
    }
  };

  const handleDelete = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete invitation');
      
      await fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Failed to delete invitation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'declined': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const filteredInvitations = filter === 'all' 
    ? invitations 
    : invitations.filter(inv => inv.status === filter);

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>
          <Mail size={32} />
          Club Invitations
        </Title>
        <FilterBar>
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
            Pending ({invitations.filter(i => i.status === 'pending').length})
          </FilterButton>
          <FilterButton active={filter === 'accepted'} onClick={() => setFilter('accepted')}>
            Accepted ({invitations.filter(i => i.status === 'accepted').length})
          </FilterButton>
          <FilterButton active={filter === 'declined'} onClick={() => setFilter('declined')}>
            Declined ({invitations.filter(i => i.status === 'declined').length})
          </FilterButton>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All ({invitations.length})
          </FilterButton>
        </FilterBar>
      </Header>

      {filteredInvitations.length === 0 ? (
        <EmptyState>
          <Mail size={64} />
          <p>No {filter !== 'all' ? filter : ''} invitations</p>
          <ExploreButton onClick={() => navigate('/discover')}>
            Discover Clubs
          </ExploreButton>
        </EmptyState>
      ) : (
        <InvitationsGrid>
          {filteredInvitations.map(invitation => (
            <InvitationCard key={invitation._id}>
              <ClubHeader>
                {invitation.club.logo ? (
                  <ClubLogo src={invitation.club.logo} alt={invitation.club.name} />
                ) : (
                  <ClubLogoPlaceholder>{invitation.club.name[0]}</ClubLogoPlaceholder>
                )}
                <ClubInfo>
                  <ClubName>{invitation.club.name}</ClubName>
                  <ClubCategory>{invitation.club.category}</ClubCategory>
                </ClubInfo>
                <StatusBadge color={getStatusColor(invitation.status)}>
                  {invitation.status === 'pending' && <Clock size={14} />}
                  {invitation.status === 'accepted' && <Check size={14} />}
                  {invitation.status === 'declined' && <X size={14} />}
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </StatusBadge>
              </ClubHeader>

              <InvitedBy>
                <UserPlus size={16} />
                Invited by {invitation.invitedBy.username}
              </InvitedBy>

              {invitation.message && (
                <MessageBox>
                  <MessageLabel>Message:</MessageLabel>
                  <MessageText>{invitation.message}</MessageText>
                </MessageBox>
              )}

              <InvitationDate>
                Received: {new Date(invitation.createdAt).toLocaleDateString()}
              </InvitationDate>

              <ButtonGroup>
                {invitation.status === 'pending' && (
                  <>
                    <AcceptButton onClick={() => handleAccept(invitation._id)}>
                      <Check size={18} />
                      Accept
                    </AcceptButton>
                    <DeclineButton onClick={() => handleDecline(invitation._id)}>
                      <X size={18} />
                      Decline
                    </DeclineButton>
                  </>
                )}
                {invitation.status !== 'pending' && (
                  <>
                    <ViewClubButton onClick={() => navigate(`/clubs/${invitation.club._id}`)}>
                      View Club
                    </ViewClubButton>
                    <DeleteButton onClick={() => handleDelete(invitation._id)}>
                      Delete
                    </DeleteButton>
                  </>
                )}
              </ButtonGroup>
            </InvitationCard>
          ))}
        </InvitationsGrid>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${props => props.active ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }
`;

const InvitationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InvitationCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ClubHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ClubLogo = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  object-fit: cover;
`;

const ClubLogoPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
`;

const ClubInfo = styled.div`
  flex: 1;
`;

const ClubName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ClubCategory = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${props => props.color};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
`;

const InvitedBy = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0;
`;

const MessageBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
`;

const MessageLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  text-transform: uppercase;
`;

const MessageText = styled.p`
  font-size: 0.875rem;
  color: #1f2937;
  margin: 0;
`;

const InvitationDate = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 1rem 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const AcceptButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #059669;
  }
`;

const DeclineButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
  }
`;

const ViewClubButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const DeleteButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    font-size: 1.125rem;
    margin-bottom: 1.5rem;
  }
`;

const ExploreButton = styled.button`
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;
