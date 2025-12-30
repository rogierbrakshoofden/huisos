// components/assignee-circles.tsx
// Display multiple assignees as stacked circles

import { FamilyMember } from '@/types/huisos-v2'

interface AssigneeCirclesProps {
  assigneeIds: string[]
  familyMembers: FamilyMember[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showNames?: boolean
}

export function AssigneeCircles({ 
  assigneeIds, 
  familyMembers, 
  max = 3,
  size = 'md',
  showNames = false
}: AssigneeCirclesProps) {
  // Get actual member objects
  const assignees = assigneeIds
    .map(id => familyMembers.find(m => m.id === id))
    .filter(Boolean) as FamilyMember[]
  
  if (assignees.length === 0) {
    return null
  }
  
  const displayAssignees = assignees.slice(0, max)
  const remainingCount = assignees.length - max
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }
  
  // If only one assignee and showNames, display differently
  if (assignees.length === 1 && showNames) {
    const member = assignees[0]
    return (
      <div className="flex items-center gap-2">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-slate-900 flex items-center justify-center font-bold`}
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </div>
        <span className="text-sm text-slate-300">{member.name}</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayAssignees.map((member, idx) => (
          <div
            key={member.id}
            className={`${sizeClasses[size]} rounded-full border-2 border-slate-900 flex items-center justify-center font-bold relative`}
            style={{ 
              backgroundColor: member.color,
              zIndex: 10 - idx
            }}
            title={member.name}
          >
            {member.initials}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center font-bold text-slate-300`}
            title={`+${remainingCount} more: ${assignees.slice(max).map(m => m.name).join(', ')}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      
      {showNames && assignees.length > 1 && (
        <span className="ml-2 text-sm text-slate-400">
          {assignees.length} people
        </span>
      )}
    </div>
  )
}
