import { Reward, RewardClaim, FamilyMember } from '@/types/huisos-v2'
import { Gift, Trophy, ShoppingBag } from 'lucide-react'

interface RewardsTabV4Props {
  rewards: Reward[]
  rewardClaims: RewardClaim[]
  familyMembers: FamilyMember[]
  currentUserId: string
  tokenBalance: number
  onRedeemReward: (rewardId: string) => Promise<void>
  onApproveRewardClaim: (claimId: string) => Promise<void>
}

export function RewardsTabV4({
  rewards,
  rewardClaims,
  familyMembers,
  currentUserId,
  tokenBalance,
  onRedeemReward,
  onApproveRewardClaim,
}: RewardsTabV4Props) {
  const pendingClaims = rewardClaims.filter(c => c.status === 'pending')
  const availableRewards = rewards.filter(r => r.active)

  const canAfford = (cost: number) => tokenBalance >= cost

  return (
    <div className="space-y-6">
      {/* Token Balance */}
      <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-md border border-amber-600/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-amber-400 font-medium mb-1">Your Balance</div>
            <div className="text-4xl font-bold text-white">{tokenBalance}</div>
            <div className="text-xs text-amber-300/70">tokens available</div>
          </div>
          <Trophy className="w-16 h-16 text-amber-400/30" />
        </div>
      </div>

      {/* Pending Claims (for parents) */}
      {pendingClaims.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 px-1">Pending Approvals</h3>
          {pendingClaims.map(claim => {
            const reward = rewards.find(r => r.id === claim.reward_id)
            const member = familyMembers.find(m => m.id === claim.member_id)
            if (!reward || !member) return null

            return (
              <div
                key={claim.id}
                className="bg-slate-900/50 backdrop-blur-md border border-amber-600/30 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-white">{reward.title}</div>
                    <div className="text-sm text-amber-400">{reward.token_cost} tokens</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Claimed by {member.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onApproveRewardClaim(claim.id)}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Approve Claim
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Available Rewards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 px-1">
          {availableRewards.length > 0 ? 'Reward Store' : 'No Rewards Yet'}
        </h3>
        {availableRewards.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No rewards available</p>
          </div>
        ) : (
          availableRewards.map(reward => {
            const affordable = canAfford(reward.token_cost)
            
            return (
              <div
                key={reward.id}
                className={`bg-slate-900/50 backdrop-blur-md border rounded-2xl p-4 transition-all ${
                  affordable
                    ? 'border-slate-700/50 hover:border-amber-600/50'
                    : 'border-slate-800/50 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">{reward.title}</div>
                    {reward.description && (
                      <div className="text-sm text-slate-400 mb-2">{reward.description}</div>
                    )}
                    <div className="text-lg font-bold text-amber-400">
                      {reward.token_cost} tokens
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRedeemReward(reward.id)}
                  disabled={!affordable}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    affordable
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {affordable ? 'Redeem Reward' : 'Not Enough Tokens'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
