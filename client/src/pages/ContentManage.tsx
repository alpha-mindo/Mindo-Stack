import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Upload, Trash2, Download, File, FileText, Image, Video, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Content {
  _id: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  category: string;
  uploadedBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

export default function ContentManage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'documents',
    file: null as File | null
  });

  useEffect(() => {
    fetchContents();
  }, [clubId]);

  const fetchContents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      setContents(data.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);

      const response = await fetch(`${API_URL}/api/clubs/${clubId}/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!response.ok) throw new Error('Failed to upload content');

      await fetchContents();
      resetForm();
      alert('Content uploaded successfully!');
    } catch (error) {
      console.error('Error uploading content:', error);
      alert('Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/content/${contentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete content');

      await fetchContents();
      alert('Content deleted successfully!');
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  const handleDownload = async (contentId: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clubs/${clubId}/content/${contentId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to download content');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading content:', error);
      alert('Failed to download content');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'documents',
      file: null
    });
    setShowForm(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType.startsWith('video/')) return <Video size={24} />;
    if (fileType.startsWith('audio/')) return <Music size={24} />;
    if (fileType.includes('pdf')) return <FileText size={24} />;
    return <File size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(`/clubs/${clubId}/manage`)}>
          <ArrowLeft size={20} />
          Back to Club
        </BackButton>
        <Title>Manage Content</Title>
        <UploadButton onClick={() => setShowForm(!showForm)}>
          <Upload size={20} />
          Upload Content
        </UploadButton>
      </Header>

      {showForm && (
        <FormCard>
          <FormTitle>Upload New Content</FormTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Title *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Document title"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the content..."
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="documents">Documents</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
                <option value="presentations">Presentations</option>
                <option value="resources">Resources</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>File *</Label>
              <FileInput
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                required
              />
              {formData.file && (
                <FileInfo>
                  Selected: {formData.file.name} ({formatFileSize(formData.file.size)})
                </FileInfo>
              )}
            </FormGroup>

            <ButtonGroup>
              <SubmitButton type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Content'}
              </SubmitButton>
              <CancelButton type="button" onClick={resetForm} disabled={uploading}>
                Cancel
              </CancelButton>
            </ButtonGroup>
          </Form>
        </FormCard>
      )}

      <ContentGrid>
        {contents.length === 0 ? (
          <EmptyState>
            <p>No content uploaded yet. Upload your first file!</p>
          </EmptyState>
        ) : (
          contents.map(content => (
            <ContentCard key={content._id}>
              <ContentHeader>
                <FileIcon>{getFileIcon(content.fileType)}</FileIcon>
                <ContentInfo>
                  <ContentTitle>{content.title}</ContentTitle>
                  <ContentMeta>
                    {content.category} • {formatFileSize(content.fileSize)}
                  </ContentMeta>
                </ContentInfo>
              </ContentHeader>

              {content.description && (
                <ContentDescription>{content.description}</ContentDescription>
              )}

              <ContentFooter>
                <UploadInfo>
                  Uploaded by {content.uploadedBy.username} on {new Date(content.createdAt).toLocaleDateString()}
                </UploadInfo>
                <ActionButtons>
                  <DownloadButton onClick={() => handleDownload(content._id, content.title)}>
                    <Download size={16} />
                    Download
                  </DownloadButton>
                  <DeleteButton onClick={() => handleDelete(content._id)}>
                    <Trash2 size={16} />
                  </DeleteButton>
                </ActionButtons>
              </ContentFooter>
            </ContentCard>
          ))
        )}
      </ContentGrid>
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
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  flex: 1;
`;

const UploadButton = styled.button`
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

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FileInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FileInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
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

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ContentHeader = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FileIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
`;

const ContentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContentTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContentMeta = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  text-transform: capitalize;
`;

const ContentDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const ContentFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  gap: 1rem;
`;

const UploadInfo = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  flex: 1;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const DeleteButton = styled.button`
  padding: 0.5rem;
  background: #fef2f2;
  color: #ef4444;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fee2e2;
  }
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
