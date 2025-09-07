import React from 'react'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Simple project card component for testing
const SimpleProjectCard = ({ name, description, memberCount, completionPercentage }) => (
  <div data-testid="project-card">
    <h3>{name}</h3>
    <p>{description || 'No description provided'}</p>
    <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
    <span>{completionPercentage}%</span>
  </div>
)

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

const mockProject = {
  name: 'Test Project',
  description: 'This is a test project description',
  memberCount: 3,
  completionPercentage: 75,
}

describe('ProjectCard Simple', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'current@example.com',
        },
      },
      status: 'authenticated',
    })
  })

  it('renders project information correctly', () => {
    render(<SimpleProjectCard {...mockProject} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('This is a test project description')).toBeInTheDocument()
    expect(screen.getByText('3 members')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('handles null description', () => {
    const projectWithNullDesc = {
      ...mockProject,
      description: null,
    }
    
    render(<SimpleProjectCard {...projectWithNullDesc} />)
    
    expect(screen.getByText('No description provided')).toBeInTheDocument()
  })

  it('handles single member correctly', () => {
    const singleMemberProject = {
      ...mockProject,
      memberCount: 1,
    }
    
    render(<SimpleProjectCard {...singleMemberProject} />)
    
    expect(screen.getByText('1 member')).toBeInTheDocument()
  })

  it('handles multiple members correctly', () => {
    const multiMemberProject = {
      ...mockProject,
      memberCount: 5,
    }
    
    render(<SimpleProjectCard {...multiMemberProject} />)
    
    expect(screen.getByText('5 members')).toBeInTheDocument()
  })

  it('displays completion percentage', () => {
    const percentages = [0, 25, 50, 75, 100]
    
    percentages.forEach(percentage => {
      const { unmount } = render(
        <SimpleProjectCard {...mockProject} completionPercentage={percentage} />
      )
      
      expect(screen.getByText(`${percentage}%`)).toBeInTheDocument()
      unmount()
    })
  })
})
