import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'
import FormBuilder, { FormQuestion } from '../components/FormBuilder'

interface ClubFormData {
  name: string
  description: string
  category: string
  logo?: string
  tags: string[]
  applicationForm: {
    isOpen: boolean
    questions: FormQuestion[]
  }
}

const CATEGORIES = [
  'Sports',
  'Academic',
  'Social',
  'Professional',
  'Arts',
  'Technology',
  'Gaming',
  'Music',
  'Business',
  'Other'
]

function ClubCreate() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    description: '',
    category: '',
    logo: '',
    tags: [],
    applicationForm: {
      isOpen: true,
      questions: []
    }
  })
  const [tagInput, setTagInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSteps = 3

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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleQuestionsChange = (questions: FormQuestion[]) => {
    setFormData({
      ...formData,
      applicationForm: {
        ...formData.applicationForm,
        questions
      }
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      // Upload logo if selected
      let logoUrl = formData.logo
      if (selectedFile) {
        const formDataFile = new FormData()
        formDataFile.append('profilePicture', selectedFile)
        
        const uploadResponse = await fetch('http://localhost:5000/api/users/upload-profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataFile
        })
        
        if (!uploadResponse.ok) throw new Error('Failed to upload logo')
        const uploadData = await uploadResponse.json()
        logoUrl = uploadData.profilePicture
      }

      // Create club
      const response = await fetch('http://localhost:5000/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create club')
      }

      const data = await response.json()
      navigate(`/clubs/${data.data._id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.description.trim() && formData.category
      case 2:
        return true // Logo and tags are optional
      case 3:
        return true
      default:
        return false
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
            <BackButton onClick={() => navigate('/clubs')}>
              <ArrowLeft size={20} />
              Back to Clubs
            </BackButton>
            <Title>Create New Club</Title>
            <Subtitle>Step {currentStep} of {totalSteps}</Subtitle>
          </Header>

          <ProgressBar>
            <ProgressFill style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
          </ProgressBar>

          <FormCard>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <StepContainer
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <StepTitle>Basic Information</StepTitle>
                    
                    <FormGroup>
                      <Label>Club Name *</Label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter club name"
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Description *</Label>
                      <TextArea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your club's purpose and activities"
                        rows={6}
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  </StepContainer>
                )}

                {currentStep === 2 && (
                  <StepContainer
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <StepTitle>Customization</StepTitle>
                    
                    <FormGroup>
                      <Label>Club Logo (Optional)</Label>
                      <LogoUploadSection>
                        {previewUrl ? (
                          <LogoPreview>
                            <LogoImage src={previewUrl} alt="Logo preview" />
                            <RemoveLogoButton onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl('')
                            }}>
                              <X size={16} />
                            </RemoveLogoButton>
                          </LogoPreview>
                        ) : (
                          <UploadButton
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={24} />
                            <span>Upload Logo</span>
                          </UploadButton>
                        )}
                        <HiddenFileInput
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </LogoUploadSection>
                    </FormGroup>

                    <FormGroup>
                      <Label>Tags (Optional)</Label>
                      <TagInputContainer>
                        <Input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add tags (press Enter)"
                        />
                        <AddButton type="button" onClick={addTag}>
                          <Plus size={18} />
                        </AddButton>
                      </TagInputContainer>
                      <TagList>
                        {formData.tags.map(tag => (
                          <Tag key={tag}>
                            {tag}
                            <RemoveTagButton onClick={() => removeTag(tag)}>
                              <X size={14} />
                            </RemoveTagButton>
                          </Tag>
                        ))}
                      </TagList>
                    </FormGroup>
                  </StepContainer>
                )}

                {currentStep === 3 && (
                  <StepContainer
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <StepTitle>Application Settings</StepTitle>
                    
                    <FormGroup>
                      <CheckboxLabel>
                        <Checkbox
                          type="checkbox"
                          checked={formData.applicationForm.isOpen}
                          onChange={(e) => setFormData({
                            ...formData,
                            applicationForm: {
                              ...formData.applicationForm,
                              isOpen: e.target.checked
                            }
                          })}
                        />
                        <span>Accept applications</span>
                      </CheckboxLabel>
                    </FormGroup>

                    {formData.applicationForm.isOpen && (
                      <FormGroup>
                        <Label>Application Form Builder</Label>
                        <FormBuilder
                          questions={formData.applicationForm.questions}
                          onChange={handleQuestionsChange}
                        />
                      </FormGroup>
                    )}

                    <InfoBox>
                      <InfoText>
                        Review all information before creating your club. You can edit these details later from the club management page.
                      </InfoText>
                    </InfoBox>
                  </StepContainer>
                )}
              </AnimatePresence>

              <ButtonGroup>
                {currentStep > 1 && (
                  <SecondaryButton type="button" onClick={prevStep}>
                    Previous
                  </SecondaryButton>
                )}
                {currentStep < totalSteps ? (
                  <PrimaryButton
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Next
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    type="submit"
                    disabled={loading || !canProceed()}
                  >
                    {loading ? 'Creating...' : 'Create Club'}
                  </PrimaryButton>
                )}
              </ButtonGroup>
            </Form>
          </FormCard>
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

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 2rem;
`

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
  transition: width 0.3s ease;
`

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);
`

const Form = styled.form``

const StepContainer = styled(motion.div)`
  min-height: 400px;
`

const StepTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 2rem 0;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

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

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
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

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
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

const LogoUploadSection = styled.div`
  display: flex;
  justify-content: center;
`

const UploadButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(99, 102, 241, 0.5);
    color: #a78bfa;
  }
`

const LogoPreview = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
`

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba(99, 102, 241, 0.3);
`

const RemoveLogoButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  border: 2px solid rgba(10, 14, 35, 1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 1);
    transform: scale(1.1);
  }
`

const HiddenFileInput = styled.input`
  display: none;
`

const TagInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`

const AddButton = styled.button`
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.875rem;
`

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #a78bfa;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;

  &:hover {
    color: #f87171;
  }
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
`

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

const InfoBox = styled.div`
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  margin-top: 1.5rem;
`

const InfoText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.6;
`

const ErrorMessage = styled.div`
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  margin-bottom: 1.5rem;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const SecondaryButton = styled.button`
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const PrimaryButton = styled.button`
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default ClubCreate
