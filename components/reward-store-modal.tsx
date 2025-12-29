'use client'

import { Reward, FamilyMember } from '@/types/huisos-v2'
import { useState } from 'react'
import { X } from 'lucide-react'

interface RewardStoreModalProps {
  isOpen: boolean
  onClose: () => void
  rewards: Reward[]
  familyMembers: FamilyMember[]
  tokens: Record<string, number>
  currentUserId: string
  onRedeem: (rewardId: string) => Promise<void>
}

export function RewardStoreModal({
  isOpen,
  onClose,
  rewards,
  familyMembers,
  tokens,
  currentUserId,
  onRedeem,
}: RewardStoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentMemberTokens = tokens[currentUserId] || 0

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (currentMemberTokens < cost) {
      setError(`Need ${cost - currentMemberTokens} more tokens`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onRedeem(rewardId)
      setError(null)
    } catch (err) {
      setError((err as Error).message || 'Failed to redeem reward')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Reward Store</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Token Balance */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Your Balance</span>
              <span className="text-2xl font-bold text-emerald-400">
                {currentMemberTokens}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mb-4 bg-red-900/80 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Rewards Grid */}
        <div className="px-6 pb-32 pt-2">
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No rewards available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const canRedeem = currentMemberTokens >= reward.token_cost
                const needed = reward.token_cost - currentMemberTokens

                return (
                  <div
                    key={reward.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 flex flex-col"
                  >
                    <div className="text-4xl mb-2">{reward.icon_emoji}</div>
                    <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">
                      {reward.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 flex-1">
                      {reward.description}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-emerald-400">
                        {reward.token_cost} tokens
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleRedeem(reward.id, reward.token_cost)
                      }
                      disabled={!canRedeem || isSubmitting}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        canRedeem
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canRedeem
                        ? 'Redeem'
                        : `+${needed} more`}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
