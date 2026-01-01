import { Trophy } from 'lucide-react'
import { Token, FamilyMember } from '@/types/huisos-v2'

interface TokenWidgetV4Props {
  tokens: Token[]
  memberId: string
  memberName: string
  onOpenRewardStore: () => void
}

export function TokenWidgetV4({
  tokens,
  memberId,
  memberName,
  onOpenRewardStore,
}: TokenWidgetV4Props) {
  const tokenBalance = tokens
    .filter(t => t.member_id === memberId)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <button
      onClick={onOpenRewardStore}
      className="w-full bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-md border border-amber-600/30 rounded-2xl p-4 hover:from-amber-600/30 hover:to-amber-800/30 transition-all shadow-lg shadow-amber-600/10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs text-amber-400 font-medium">
            {memberName}'s Tokens
          </div>
          <div className="text-3xl font-bold text-white">{tokenBalance}</div>
        </div>
        <Trophy className="w-10 h-10 text-amber-400/60 flex-shrink-0" />
      </div>
    </button>
  )
}
