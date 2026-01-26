import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { User, Mail, Edit2, Save, X, Key, LogOut, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import { API_URL } from '../config'

interface ProfileData {
  username: string
  email: string
  bio?: string
  profilePicture?: string
}

function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    email: '',
    bio: '',
    profilePicture: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        bio: '',
        profilePicture: user.profilePicture || ''
      })
      setPreviewUrl(user.profilePicture || '')
    }
  }, [user])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      
      // If there's a file, upload it first
      let profilePictureUrl = formData.profilePicture
      if (selectedFile) {
        const formDataFile = new FormData()
        formDataFile.append('profilePicture', selectedFile)
        
        const uploadResponse = await fetch(`${API_URL}/api/users/upload-profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataFile
        })
        
        if (!uploadResponse.ok) throw new Error('Failed to upload profile picture')
        const uploadData = await uploadResponse.json()
        profilePictureUrl = uploadData.profilePicture
      }

      // Update profile with new data
      const response = await fetch(`${API_URL}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, profilePicture: profilePictureUrl })
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      setMessage('Profile updated successfully!')
      setIsEditing(false)
      setSelectedFile(null)
      
      // Update local storage
      const updatedUser = { ...user, ...formData, profilePicture: profilePictureUrl }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      window.location.reload() // Reload to update navbar
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            <Title>My Profile</Title>
            <Subtitle>Manage your account settings</Subtitle>
          </Header>

          <ProfileCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardHeader>
              <HeaderTitle>Profile Information</HeaderTitle>
              {!isEditing && (
                <EditButton
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit2 size={16} />
                  Edit Profile
                </EditButton>
              )}
            </CardHeader>

            {message && <SuccessMessage>{message}</SuccessMessage>}
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Form onSubmit={handleSubmit}>
              <ProfilePictureSection>
                <AvatarContainer>
                  {previewUrl ? (
                    <Avatar src={previewUrl} alt="Profile" />
                  ) : (
                    <AvatarPlaceholder>
                      <User size={48} />
                    </AvatarPlaceholder>
                  )}
                  {isEditing && (
                    <UploadButton
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Camera size={18} />
                    </UploadButton>
                  )}
                </AvatarContainer>
                <HiddenFileInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </ProfilePictureSection>
              <FormGroup>
                <Label>
                  <User size={18} />
                  Username
                </Label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={!isEditing}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <Mail size={18} />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => 
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Bio</Label>
                <TextArea
                  value={formData.bio || ''}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </FormGroup>

              {isEditing && (
                <ButtonGroup>
                  <SaveButton
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </SaveButton>
                  <CancelButton
                    type="button"
                    onClick={() => setIsEditing(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={18} />
                    Cancel
                  </CancelButton>
                </ButtonGroup>
              )}
            </Form>

            <Divider />

            <ActionsSection>
              <SectionTitle>Account Actions</SectionTitle>
              <ActionButton
                onClick={() => navigate('/change-password')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Key size={18} />
                Change Password
              </ActionButton>
              <LogoutButton
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={18} />
                Logout
              </LogoutButton>
            </ActionsSection>
          </ProfileCard>
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
  max-width: 800px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  margin-bottom: 3rem;
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

const ProfilePictureSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`

const AvatarContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(99, 102, 241, 0.3);
`

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(99, 102, 241, 0.3);
  color: rgba(255, 255, 255, 0.6);
`

const UploadButton = styled(motion.button)`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: 3px solid rgba(10, 14, 35, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);

  &:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
  }
`

const HiddenFileInput = styled.input`
  display: none;
`

const ProfileCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const HeaderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`

const EditButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
`

const SuccessMessage = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 12px;
  color: #4ade80;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
`

const ErrorMessage = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  color: #f87171;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  
  svg {
    color: rgba(99, 102, 241, 0.7);
  }
`

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.9375rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`

const SaveButton = styled(motion.button)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const CancelButton = styled(motion.button)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  color: #f87171;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
`

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 2rem 0;
`

const ActionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
`

const ActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 12px;
  color: #a78bfa;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.15);
  }
`

const LogoutButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  color: #f87171;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.15);
  }
`

export default Profile
