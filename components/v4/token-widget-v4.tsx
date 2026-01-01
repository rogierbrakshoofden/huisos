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
      className="w-full bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-md border border-amber-600/30 rounded-2xl p-6 hover:from-amber-600/30 hover:to-amber-800/30 transition-all shadow-lg shadow-amber-600/10"
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-sm text-amber-400 font-medium mb-1">
            {memberName}'s Tokens
          </div>
          <div className="text-4xl font-bold text-white">{tokenBalance}</div>
        </div>
        <Trophy className="w-12 h-12 text-amber-400/50" />
      </div>
    </button>
  )
}
