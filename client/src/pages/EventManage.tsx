import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { API_URL } from '../config';

interface Event {
  _id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  maxParticipants?: number;
  cost?: number;
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

export default function EventManage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    maxParticipants: '',
    cost: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [clubId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingEvent 
        ? `${API_URL}/api/clubs/${clubId}/events/${editingEvent._id}`
        : `${API_URL}/api/clubs/${clubId}/events`;
      
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to save event');

      await fetchEvents();
      resetForm();
      alert(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      location: event.location,
      maxParticipants: event.maxParticipants?.toString() || '',
      cost: event.cost?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      await fetchEvents();
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      location: '',
      maxParticipants: '',
      cost: ''
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(`/clubs/${clubId}/manage`)}>
          <ArrowLeft size={20} />
          Back to Club
        </BackButton>
        <Title>Manage Events</Title>
        <CreateButton onClick={() => setShowForm(!showForm)}>
          <Plus size={20} />
          Create Event
        </CreateButton>
      </Header>

      {showForm && (
        <FormCard>
          <FormTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</FormTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Event Title *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Annual Tech Conference"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description *</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Event details and agenda..."
                rows={4}
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Event Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Location *</Label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="Convention Center, Room 101"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="50"
                  min="1"
                />
              </FormGroup>

              <FormGroup>
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  min="0"
                />
              </FormGroup>
            </FormRow>

            <ButtonGroup>
              <SubmitButton type="submit">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </SubmitButton>
              <CancelButton type="button" onClick={resetForm}>
                Cancel
              </CancelButton>
            </ButtonGroup>
          </Form>
        </FormCard>
      )}

      <EventsGrid>
        {events.length === 0 ? (
          <EmptyState>
            <p>No events yet. Create your first event!</p>
          </EmptyState>
        ) : (
          events.map(event => (
            <EventCard key={event._id}>
              <EventHeader>
                <EventTitle>{event.title}</EventTitle>
                <ActionButtons>
                  <IconButton onClick={() => handleEdit(event)} title="Edit">
                    <Edit size={18} />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(event._id)} title="Delete" $danger>
                    <Trash2 size={18} />
                  </IconButton>
                </ActionButtons>
              </EventHeader>

              <EventDescription>{event.description}</EventDescription>

              <EventDetails>
                <DetailItem>
                  <Calendar size={16} />
                  {new Date(event.eventDate).toLocaleString()}
                </DetailItem>
                <DetailItem>
                  <MapPin size={16} />
                  {event.location}
                </DetailItem>
                {event.maxParticipants && (
                  <DetailItem>
                    <Users size={16} />
                    Max: {event.maxParticipants} participants
                  </DetailItem>
                )}
                {event.cost !== undefined && event.cost > 0 && (
                  <DetailItem>
                    <DollarSign size={16} />
                    ${event.cost.toFixed(2)}
                  </DetailItem>
                )}
              </EventDetails>

              <EventFooter>
                Created by {event.createdBy.username} on {new Date(event.createdAt).toLocaleDateString()}
              </EventFooter>
            </EventCard>
          ))
        )}
      </EventsGrid>
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  flex: 1;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
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

const FormCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
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

const CancelButton = styled.button`
  padding: 0.75rem 2rem;
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

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EventCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
`;

const EventTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  padding: 0.5rem;
  background: ${props => props.$danger ? '#fef2f2' : '#f3f4f6'};
  color: ${props => props.$danger ? '#ef4444' : '#6b7280'};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.$danger ? '#fee2e2' : '#e5e7eb'};
  }
`;

const EventDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;

  svg {
    color: #9ca3af;
  }
`;

const EventFooter = styled.div`
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;

  p {
    font-size: 1.125rem;
  }
`;
