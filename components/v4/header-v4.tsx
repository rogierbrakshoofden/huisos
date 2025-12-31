import { UserSwitcherButtonV4 } from './user-switcher-v4'
import { AddButtonV4 } from './add-button-v4'
import { FamilyMember } from '@/types/huisos-v2'

interface HeaderV4Props {
  activeUserId: string | 'everybody'
  familyMembers: FamilyMember[]
  onUserChange: (userId: string | 'everybody') => void
  onAddClick: () => void
}

export function HeaderV4({
  activeUserId,
  familyMembers,
  onUserChange,
  onAddClick,
}: HeaderV4Props) {
  const activeUser = familyMembers.find((m) => m.id === activeUserId)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
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
        <AddButtonV4 onClick={onAddClick} />
      </div>
    </header>
  )
}
