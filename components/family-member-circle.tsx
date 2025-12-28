import { cn } from '@/lib/utils'

interface FamilyMemberCircleProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  grayed?: boolean
}

const sizeMap = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
}

export function FamilyMemberCircle({
  initials,
  color,
  size = 'md',
  className,
  grayed = false,
}: FamilyMemberCircleProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        sizeMap[size],
        grayed && 'opacity-40',
        className
      )}
      style={{ backgroundColor: grayed ? '#6b7280' : color }}
    >
      <span className="text-white">{initials}</span>
    </div>
  )
}
