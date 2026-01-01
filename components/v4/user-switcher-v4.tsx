import { useState } from 'react'
import { FamilyMember } from '@/types/huisos-v2'
import { Check, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserSwitcherButtonV4Props {
  activeUser?: FamilyMember
  activeUserId: string | 'everybody'
  familyMembers: FamilyMember[]
  onUserChange: (userId: string | 'everybody') => void
}

export function UserSwitcherButtonV4({
  activeUser,
  activeUserId,
  familyMembers,
  onUserChange,
}: UserSwitcherButtonV4Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => setIsOpen(false)

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform hover:scale-105"
        style={{ backgroundColor: activeUser?.color || '#64748b' }}
      >
        {activeUserId === 'everybody' ? (
          <Users className="w-5 h-5" />
        ) : (
          activeUser?.initials || 'A'
        )}
      </button>

      {/* Fullscreen Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-0 m-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="absolute inset-0 w-screen h-screen sm:inset-auto sm:relative sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:m-auto flex flex-col bg-slate-950/95 backdrop-blur-xl sm:rounded-3xl sm:border sm:border-slate-700/50 sm:shadow-2xl">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl z-10">
              <h2 className="text-xl font-bold text-white">Switch User</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-800/50 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onUserChange(member.id)
                    handleClose()
                  }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl transition-all',
                    activeUserId === member.id
                      ? 'bg-slate-800/60 border border-slate-700'
                      : 'hover:bg-slate-800/30 border border-transparent'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <span className="text-white font-medium text-left flex-1">{member.name}</span>
                  {activeUserId === member.id && (
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Everybody Option */}
              <button
                onClick={() => {
                  onUserChange('everybody')
                  handleClose()
                }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-t border-slate-700/50 mt-4 pt-6',
                  activeUserId === 'everybody'
                    ? 'bg-slate-800/60 border border-slate-700'
                    : 'hover:bg-slate-800/30 border border-transparent'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-white font-medium text-left flex-1">Everybody</span>
                {activeUserId === 'everybody' && (
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
