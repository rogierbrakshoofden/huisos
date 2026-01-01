import { UserSwitcherButtonV4 } from './user-switcher-v4'
import { AddButtonV4 } from './add-button-v4'
import { FamilyMember } from '@/types/huisos-v2'

interface HeaderV4Props {
  activeUserId: string | 'everybody'
  familyMembers: FamilyMember[]
  onUserChange: (userId: string | 'everybody') => void
  onTaskClick: () => void
  onEventClick: () => void
}

export function HeaderV4({
  activeUserId,
  familyMembers,
  onUserChange,
  onTaskClick,
  onEventClick,
}: HeaderV4Props) {
  const activeUser = familyMembers.find((m) => m.id === activeUserId)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 backdrop-blur-sm border-b border-slate-800/30 safe-area-inset-top">
      {/* Safe area padding for notch/camera bump */}
      <div className="h-[env(safe-area-inset-top)]" />
      
      {/* Header content - 64px tall */}
      <div className="h-16 max-w-2xl mx-auto px-4 flex items-center justify-between">
        {/* Left: User Switcher Button */}
        <UserSwitcherButtonV4
          activeUser={activeUser}
          activeUserId={activeUserId}
          familyMembers={familyMembers}
          onUserChange={onUserChange}
        />

        {/* Center: Brand */}
        <h1 className="text-2xl font-bold text-white">HuisOS v4</h1>

        {/* Right: Add Button */}
        <AddButtonV4 onTaskClick={onTaskClick} onEventClick={onEventClick} />
      </div>
    </header>
  )
}
