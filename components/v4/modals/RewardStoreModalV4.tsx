import { X, Gift } from 'lucide-react'
import { Reward } from '@/types/huisos-v2'

interface RewardStoreModalV4Props {
  rewards: Reward[]
  tokenBalance: number
  isOpen: boolean
  onClose: () => void
  onRedeemReward: (rewardId: string) => Promise<void>
}

export function RewardStoreModalV4({
  rewards,
  tokenBalance,
  isOpen,
  onClose,
  onRedeemReward,
}: RewardStoreModalV4Props) {
  const availableRewards = rewards.filter(r => !r.is_archived)
  const canAfford = (cost: number) => tokenBalance >= cost

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 z-10">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-bold text-white">Reward Store</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
          
          {/* Token Balance */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-md border border-amber-600/30 rounded-2xl p-6">
              <div className="text-sm text-amber-400 font-medium mb-1">Your Balance</div>
              <div className="text-4xl font-bold text-white">{tokenBalance}</div>
              <div className="text-xs text-amber-300/70">tokens available</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {availableRewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No rewards available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableRewards.map(reward => {
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
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-7 h-7 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-lg mb-1">{reward.title}</div>
                        {reward.description && (
                          <div className="text-sm text-slate-400 mb-3">{reward.description}</div>
                        )}
                        <div className="text-2xl font-bold text-amber-400">
                          {reward.token_cost} tokens
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRedeemReward(reward.id)}
                      disabled={!affordable}
                      className={`w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                        affordable
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {affordable ? 'Redeem Now' : `Need ${reward.token_cost - tokenBalance} more tokens`}
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
