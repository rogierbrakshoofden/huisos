import { useState } from 'react'
import { FamilyMember } from '@/types/huisos-v2'
import { Check, Users } from 'lucide-react'
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pt-24 sm:pt-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-slate-900/95 backdrop-blur-md rounded-3xl w-5/6 sm:max-w-md p-6 border border-slate-700/50 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">Switch User</h2>

            <div className="space-y-3">
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onUserChange(member.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl transition-all',
                    activeUserId === member.id
                      ? 'bg-slate-800/60 border border-slate-700'
                      : 'hover:bg-slate-800/30'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <span className="text-white font-medium text-left">{member.name}</span>
                  {activeUserId === member.id && (
                    <Check className="w-5 h-5 text-emerald-400 ml-auto" />
                  )}
                </button>
              ))}

              <button
                onClick={() => {
                  onUserChange('everybody')
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-t border-slate-700/50 mt-4 pt-6',
                  activeUserId === 'everybody'
                    ? 'bg-slate-800/60 border border-slate-700'
                    : 'hover:bg-slate-800/30'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">Everybody</span>
                {activeUserId === 'everybody' && (
                  <Check className="w-5 h-5 text-emerald-400 ml-auto" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
