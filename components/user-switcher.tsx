// components/user-switcher.tsx
import React, { useState, useRef, useEffect } from 'react'
import { FamilyMemberCircle } from '@/components/family-member-circle'
import { FamilyMember } from '@/types/huisos-v2'

interface UserSwitcherProps {
  activeUserId: string | 'everybody'
  familyMembers: FamilyMember[]
  onUserChange: (userId: string | 'everybody') => void
}

export function UserSwitcher({
  activeUserId,
  familyMembers,
  onUserChange,
}: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const getActiveUserLabel = () => {
    if (activeUserId === 'everybody') {
      return '👥 Everyone'
    }
    const member = familyMembers.find((m) => m.id === activeUserId)
    return member?.initials || 'U'
  }

  const handleUserSelect = (userId: string | 'everybody') => {
    onUserChange(userId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="fixed top-4 left-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          bg-slate-900/50 border border-slate-800/50
          backdrop-blur-md transition-all duration-200
          hover:bg-slate-800/60 hover:border-slate-700/50
          ${isOpen ? 'bg-slate-800/60 border-slate-700/50' : ''}
        `}
      >
        <div className="text-sm font-medium text-white">{getActiveUserLabel()}</div>
      </button>

      {isOpen && (
        <div
          className="
            absolute top-12 left-0 mt-2 min-w-max
            bg-slate-900/95 border border-slate-800/50
            rounded-lg p-2 backdrop-blur-md shadow-2xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          <button
            onClick={() => handleUserSelect('everybody')}
            className={`
              w-full text-left px-4 py-2 rounded-md text-sm transition-colors
              ${activeUserId === 'everybody'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800/50'
              }
            `}
          >
            👥 Everyone
          </button>

          <div className="h-px bg-slate-800 my-1" />

          {familyMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleUserSelect(member.id)}
              className={`
                w-full text-left px-4 py-2 rounded-md text-sm transition-colors
                flex items-center gap-2
                ${activeUserId === member.id
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50'
                }
              `}
            >
              <FamilyMemberCircle
                member={member}
                size="sm"
                showInitials
              />
              {member.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
