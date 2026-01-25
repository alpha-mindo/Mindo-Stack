import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Search, Filter, Users, TrendingUp, Plus, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Notifications from '../components/Notifications'

interface Club {
  _id: string
  name: string
  description: string
  logo?: string
  category: string
  memberCount: number
  tags: string[]
  applicationForm?: {
    isOpen: boolean
  }
}

function Discover() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const categories = ['all', 'Sports', 'Academic', 'Social', 'Professional', 'Arts', 'Technology', 'Gaming', 'Music', 'Business']

  useEffect(() => {
    fetchClubs()
  }, [])

  useEffect(() => {
    filterClubs()
  }, [searchQuery, selectedCategory, clubs])

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/clubs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch clubs')
      
      const data = await response.json()
      // Ensure data is an array
      const clubsArray = Array.isArray(data) ? data : (data.clubs || [])
      setClubs(clubsArray)
      setFilteredClubs(clubsArray)
    } catch (err) {
      console.error('Error fetching clubs:', err)
      setClubs([])
      setFilteredClubs([])
    } finally {
      setLoading(false)
    }
  }

  const filterClubs = () => {
    let filtered = clubs

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(club => club.category === selectedCategory)
    }

    setFilteredClubs(filtered)
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
            <HeaderText>
              <Title>Discover Clubs</Title>
              <Subtitle>Find and join clubs that match your interests</Subtitle>
            </HeaderText>
            <CreateButton
              onClick={() => navigate('/clubs/create')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Create Club
            </CreateButton>
          </Header>

          <SearchSection>
            <SearchBar>
              <Search size={20} />
              <SearchInput
                type="text"
                placeholder="Search clubs by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <ClearButton onClick={() => setSearchQuery('')}>
                  <X size={18} />
                </ClearButton>
              )}
            </SearchBar>
            <FilterButton
              onClick={() => setShowFilters(!showFilters)}
              $active={showFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter size={18} />
              Filters
            </FilterButton>
          </SearchSection>

          {showFilters && (
            <FiltersPanel
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FilterLabel>Category</FilterLabel>
              <CategoryGrid>
                {categories.map(category => (
                  <CategoryChip
                    key={category}
                    $active={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category}
                  </CategoryChip>
                ))}
              </CategoryGrid>
            </FiltersPanel>
          )}

          <ResultsHeader>
            <ResultsCount>
              {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
            </ResultsCount>
          </ResultsHeader>

          <ClubsSection>
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading clubs...</LoadingText>
              </LoadingContainer>
            ) : filteredClubs.length === 0 ? (
              <EmptyState
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <EmptyIcon>
                  <Users size={64} />
                </EmptyIcon>
                <EmptyTitle>No Clubs Found</EmptyTitle>
                <EmptyText>
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to create a club!'}
                </EmptyText>
                <CreateButton onClick={() => navigate('/clubs/create')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Plus size={20} />
                  Create First Club
                </CreateButton>
              </EmptyState>
            ) : (
              <ClubsGrid>
                {filteredClubs.map((club, index) => (
                  <ClubCard
                    key={club._id}
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    {club.logo ? (
                      <ClubLogo src={club.logo} alt={club.name} />
                    ) : (
                      <ClubLogoPlaceholder>
                        <Users size={40} />
                      </ClubLogoPlaceholder>
                    )}
                    <ClubContent>
                      <ClubHeader>
                        <ClubName>{club.name}</ClubName>
                        {club.applicationForm?.isOpen && (
                          <OpenBadge>
                            <TrendingUp size={12} />
                            Open
                          </OpenBadge>
                        )}
                      </ClubHeader>
                      <ClubDescription>{club.description}</ClubDescription>
                      {club.tags && club.tags.length > 0 && (
                        <TagsContainer>
                          {club.tags.slice(0, 3).map((tag, i) => (
                            <Tag key={i}>#{tag}</Tag>
                          ))}
                          {club.tags.length > 3 && (
                            <MoreTags>+{club.tags.length - 3}</MoreTags>
                          )}
                        </TagsContainer>
                      )}
                      <ClubFooter>
                        <CategoryTag>{club.category}</CategoryTag>
                        <MemberCount>
                          <Users size={14} />
                          {club.memberCount}
                        </MemberCount>
                      </ClubFooter>
                    </ClubContent>
                  </ClubCard>
                ))}
              </ClubsGrid>
            )}
          </ClubsSection>
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
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`

const HeaderText = styled.div`
  flex: 1;
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

const CreateButton = styled(motion.button)`
  display: flex;
  align-items: center;
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
`

const SearchSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SearchBar = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  
  svg {
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }
`

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.9375rem;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const ClearButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }
`

const FilterButton = styled(motion.button)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active 
    ? 'rgba(99, 102, 241, 0.5)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
`

const FiltersPanel = styled(motion.div)`
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
`

const FilterLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const CategoryGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const CategoryChip = styled(motion.button)<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active 
    ? 'rgba(99, 102, 241, 0.5)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: capitalize;
`

const ResultsHeader = styled.div`
  margin-bottom: 1.5rem;
`

const ResultsCount = styled.div`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`

const ClubsSection = styled.section``

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
`

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
`

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
`

const EmptyIcon = styled.div`
  color: rgba(99, 102, 241, 0.3);
  margin-bottom: 1.5rem;
`

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
`

const EmptyText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 2rem 0;
  max-width: 400px;
`

const ClubsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`

const ClubCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.2);
  }
`

const ClubLogo = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`

const ClubLogoPlaceholder = styled.div`
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  color: rgba(255, 255, 255, 0.4);
`

const ClubContent = styled.div`
  padding: 1.5rem;
`

const ClubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
`

const ClubName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  flex: 1;
`

const OpenBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4ade80;
  text-transform: uppercase;
  white-space: nowrap;
`

const ClubDescription = styled.p`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const Tag = styled.span`
  padding: 0.25rem 0.625rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  font-size: 0.75rem;
  color: #a78bfa;
  font-weight: 500;
`

const MoreTags = styled.span`
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
`

const ClubFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const CategoryTag = styled.span`
  padding: 0.375rem 0.875rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #818cf8;
  text-transform: capitalize;
`

const MemberCount = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  
  svg {
    color: rgba(99, 102, 241, 0.7);
  }
`

export default Discover
