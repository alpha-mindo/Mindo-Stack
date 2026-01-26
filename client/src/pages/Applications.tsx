import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Application {
  _id: string;
  club: {
    _id: string;
    name: string;
    logo?: string;
    category: string;
  };
  user: {
    _id: string;
    username: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'interview' | 'cancelled';
  appliedAt: string;
  interviewDate?: string;
  message?: string;
  rejectionReason?: string;
}

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchApplications();
  }, [user, navigate]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/applications/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch applications');
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to cancel this application?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/applications/${applicationId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to cancel application');
      
      await fetchApplications();
      alert('Application cancelled successfully');
    } catch (error) {
      console.error('Error cancelling application:', error);
      alert('Failed to cancel application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'interview': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>My Applications</Title>
        <FilterBar>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All ({applications.length})
          </FilterButton>
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
            Pending ({applications.filter(a => a.status === 'pending').length})
          </FilterButton>
          <FilterButton active={filter === 'interview'} onClick={() => setFilter('interview')}>
            Interview ({applications.filter(a => a.status === 'interview').length})
          </FilterButton>
          <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')}>
            Approved ({applications.filter(a => a.status === 'approved').length})
          </FilterButton>
          <FilterButton active={filter === 'rejected'} onClick={() => setFilter('rejected')}>
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </FilterButton>
        </FilterBar>
      </Header>

      {filteredApplications.length === 0 ? (
        <EmptyState>
          <p>No applications found</p>
          <ExploreButton onClick={() => navigate('/discover')}>
            Discover Clubs
          </ExploreButton>
        </EmptyState>
      ) : (
        <ApplicationGrid>
          {filteredApplications.map(application => (
            <ApplicationCard key={application._id}>
              <ClubHeader>
                {application.club.logo ? (
                  <ClubLogo src={application.club.logo} alt={application.club.name} />
                ) : (
                  <ClubLogoPlaceholder>{application.club.name[0]}</ClubLogoPlaceholder>
                )}
                <ClubInfo>
                  <ClubName>{application.club.name}</ClubName>
                  <ClubCategory>{application.club.category}</ClubCategory>
                </ClubInfo>
              </ClubHeader>

              <StatusBadge color={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </StatusBadge>

              <ApplicationDate>
                Applied: {new Date(application.appliedAt).toLocaleDateString()}
              </ApplicationDate>

              {application.interviewDate && (
                <InterviewDate>
                  Interview: {new Date(application.interviewDate).toLocaleString()}
                </InterviewDate>
              )}

              {application.message && (
                <MessageBox>
                  <MessageLabel>Your Message:</MessageLabel>
                  <MessageText>{application.message}</MessageText>
                </MessageBox>
              )}

              {application.rejectionReason && (
                <RejectionBox>
                  <MessageLabel>Rejection Reason:</MessageLabel>
                  <MessageText>{application.rejectionReason}</MessageText>
                </RejectionBox>
              )}

              <ButtonGroup>
                <ViewClubButton onClick={() => navigate(`/club/${application.club._id}`)}>
                  View Club
                </ViewClubButton>
                {application.status === 'pending' && (
                  <CancelButton onClick={() => cancelApplication(application._id)}>
                    Cancel Application
                  </CancelButton>
                )}
              </ButtonGroup>
            </ApplicationCard>
          ))}
        </ApplicationGrid>
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

const ApplicationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const ApplicationCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  position: relative;
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
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${props => props.color};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const ApplicationDate = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0;
`;

const InterviewDate = styled.p`
  font-size: 0.875rem;
  color: #f59e0b;
  font-weight: 600;
  margin: 0.5rem 0;
`;

const MessageBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
`;

const RejectionBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ViewClubButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;

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
