'use client'

import { RewardClaim, Reward, FamilyMember } from '@/types/huisos-v2'

interface MyRewardsTabProps {
  rewardClaims: RewardClaim[]
  rewards: Reward[]
  familyMembers: FamilyMember[]
  currentUserId: string
  isParent?: boolean
  onApprove?: (claimId: string) => Promise<void>
  onClaim?: (claimId: string) => Promise<void>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/40 border-yellow-700 text-yellow-300',
  approved: 'bg-blue-900/40 border-blue-700 text-blue-300',
  claimed: 'bg-green-900/40 border-green-700 text-green-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  claimed: 'Claimed ✓',
}

export function MyRewardsTab({
  rewardClaims,
  rewards,
  familyMembers,
  currentUserId,
  isParent = false,
  onApprove,
  onClaim,
}: MyRewardsTabProps) {
  const relevantClaims = isParent ? rewardClaims : rewardClaims.filter((c) => c.member_id === currentUserId)

  const getPendingClaims = () => relevantClaims.filter((c) => c.status === 'pending')
  const getApprovedClaims = () => relevantClaims.filter((c) => c.status === 'approved')
  const getClaimedClaims = () => relevantClaims.filter((c) => c.status === 'claimed')

  const getMember = (memberId: string) =>
    familyMembers.find((m) => m.id === memberId)

  const getReward = (rewardId: string) =>
    rewards.find((r) => r.id === rewardId)

  const renderClaim = (claim: RewardClaim) => {
    const reward = getReward(claim.reward_id)
    const member = getMember(claim.member_id)

    if (!reward) return null

    return (
      <div
        key={claim.id}
        className={`border rounded-lg p-4 flex items-start justify-between ${
          statusColors[claim.status]
        }`}
      >
        <div className="flex-1">
          <div className="font-bold text-white mb-1">{reward.title}</div>
          {isParent && (
            <div className="text-sm opacity-75 mb-2">
              Redeemed by {member?.name}
            </div>
          )}
          <div className="text-xs opacity-75">
            {new Date(claim.redeemed_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded">
            {statusLabels[claim.status]}
          </span>

          {isParent && claim.status === 'pending' && onApprove && (
            <button
              onClick={() => onApprove(claim.id)}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Approve
            </button>
          )}

          {isParent && claim.status === 'approved' && onClaim && (
            <button
              onClick={() => onClaim(claim.id)}
              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Mark Claimed
            </button>
          )}
        </div>
      </div>
    )
  }

  const allClaims = [
    ...getClaimedClaims(),
    ...getApprovedClaims(),
    ...getPendingClaims(),
  ]

  return (
    <div className="space-y-6">
      {/* Pending */}
      {getPendingClaims().length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">
            Pending Approval ({getPendingClaims().length})
          </h3>
          <div className="space-y-2">
            {getPendingClaims().map(renderClaim)}
          </div>
        </div>
      )}

      {/* Approved */}
      {getApprovedClaims().length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-3">
            Approved ({getApprovedClaims().length})
          </h3>
          <div className="space-y-2">
            {getApprovedClaims().map(renderClaim)}
          </div>
        </div>
      )}

      {/* Claimed */}
      {getClaimedClaims().length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-green-400 mb-3">
            Claimed ({getClaimedClaims().length})
          </h3>
          <div className="space-y-2">
            {getClaimedClaims().map(renderClaim)}
          </div>
        </div>
      )}

      {allClaims.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {isParent
              ? 'No reward claims yet'
              : 'No rewards redeemed yet. Visit the Reward Store!'}
          </p>
        </div>
      )}
    </div>
  )
}
