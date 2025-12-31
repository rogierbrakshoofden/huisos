'use client'

import { Coins } from 'lucide-react'

interface TokenWidgetV4Props {
  tokenBalance: number
  memberName: string
  onOpenRewardStore: () => void
}

export function TokenWidgetV4({
  tokenBalance,
  memberName,
  onOpenRewardStore,
}: TokenWidgetV4Props) {
  return (
    <button
      onClick={onOpenRewardStore}
      className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/60 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center group-hover:bg-amber-600/30 transition-colors">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-white">
              {tokenBalance}
            </div>
            <div className="text-sm text-slate-400">
              {memberName}'s tokens
            </div>
          </div>
        </div>
        <div className="text-sm text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors">
          Open Store →
        </div>
      </div>
    </button>
  )
}
