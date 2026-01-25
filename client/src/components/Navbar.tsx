import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Calendar, MessageSquare, LogOut, User, LucideIcon } from 'lucide-react'
import styled from 'styled-components'

interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const SidebarContainer = styled(motion.div)`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 35, 0.98) 100%);
  backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid rgba(99, 102, 241, 0.15);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`

const SidebarHeader = styled.div`
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.625rem;
  min-height: 72px;
`

const BrandLogo = styled(motion.div)`
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
`

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`

const BrandName = styled(motion.span)`
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.2px;
  white-space: nowrap;
`

const SidebarNav = styled.nav`
  flex: 1;
  padding: 1rem 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
`

const NavItem = styled(motion.button)<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.875rem;
  background: ${props => props.$isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent'};
  border: none;
  border-radius: 12px;
  color: ${props => props.$isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  overflow: hidden;

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
`

const NavIcon = styled.div<{ $isActive: boolean }>`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: ${props => props.$isActive ? '#a78bfa' : 'inherit'};
  
  svg {
    stroke-width: 2;
  }
`

const NavLabel = styled(motion.span)`
  white-space: nowrap;
  flex: 1;
  text-align: left;
`

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  width: 3px;
  background: linear-gradient(180deg, #6366f1 0%, #a855f7 100%);
  border-radius: 0 2px 2px 0;
`

const SidebarFooter = styled.div`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
`

const FooterButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  min-height: 48px;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const UserButton = styled(FooterButton)`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
  border-color: rgba(99, 102, 241, 0.25);
  color: #ffffff;

  &:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%);
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
  }
`

const LogoutButton = styled(FooterButton)`
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  color: #f87171;

  &:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.2);
  }
`

const FooterIcon = styled.div<{ $isPurple?: boolean; $isRed?: boolean }>`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: ${props => props.$isPurple ? '#a78bfa' : props.$isRed ? '#f87171' : 'inherit'};
  
  svg {
    stroke-width: 2;
  }
`

const UserInfo = styled(motion.div)`
  overflow: hidden;
  white-space: nowrap;
`

const UserName = styled.div`
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.875rem;
  font-weight: 600;
`

const LogoutLabel = styled(motion.span)`
  white-space: nowrap;
  font-size: 0.9375rem;
  font-weight: 600;
  overflow: hidden;
`

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'clubs', label: 'My Clubs', icon: Users, path: '/clubs' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/events' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages' }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <SidebarContainer
      initial={{ x: -300 }}
      animate={{ x: 0, width: isCollapsed ? '80px' : '280px' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo Section */}
      <SidebarHeader>
        <BrandLogo
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogoText>M</LogoText>
        </BrandLogo>
        <AnimatePresence>
          {!isCollapsed && (
            <BrandName
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Mindo Stack
            </BrandName>
          )}
        </AnimatePresence>
      </SidebarHeader>

      {/* Navigation Items */}
      <SidebarNav>
        {navigationItems.map((item) => (
          <NavItem
            key={item.id}
            $isActive={isActive(item.path)}
            onClick={() => navigate(item.path)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <NavIcon $isActive={isActive(item.path)}>
              <item.icon />
            </NavIcon>
            <AnimatePresence>
              {!isCollapsed && (
                <NavLabel
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </NavLabel>
              )}
            </AnimatePresence>
            {isActive(item.path) && (
              <ActiveIndicator
                layoutId="activeIndicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </NavItem>
        ))}
      </SidebarNav>

      {/* Footer Section */}
      <SidebarFooter>
        {/* User Profile Button */}
        <UserButton
          onClick={() => navigate('/profile')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FooterIcon $isPurple>
            <User />
          </FooterIcon>
          <AnimatePresence>
            {!isCollapsed && (
              <UserInfo
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <UserName>{user?.username}</UserName>
              </UserInfo>
            )}
          </AnimatePresence>
        </UserButton>

        {/* Logout Button */}
        <LogoutButton
          onClick={handleSignOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FooterIcon $isRed>
            <LogOut />
          </FooterIcon>
          <AnimatePresence>
            {!isCollapsed && (
              <LogoutLabel
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </LogoutLabel>
            )}
          </AnimatePresence>
        </LogoutButton>
      </SidebarFooter>
    </SidebarContainer>
  )
}

export default Navbar
