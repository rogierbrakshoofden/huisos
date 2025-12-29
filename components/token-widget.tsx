'use client'

import { FamilyMember, Token } from '@/types/huisos-v2'
import { useState } from 'react'

interface TokenWidgetProps {
  familyMembers: FamilyMember[]
  tokens: Token[]
}

export function TokenWidget({ familyMembers, tokens }: TokenWidgetProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const getTokenCount = (memberId: string) => {
    return tokens
      .filter((t) => t.member_id === memberId)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getMemberTokens = (memberId: string) => {
    return tokens.filter((t) => t.member_id === memberId).slice(-10)
  }

  const getMemberColor = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      yellow: 'bg-yellow-600',
      blue: 'bg-blue-600',
    }
    return colorMap[color] || 'bg-slate-600'
  }

  const member = selectedMemberId
    ? familyMembers.find((m) => m.id === selectedMemberId)
    : null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-white mb-4">Token Balance</h2>
      <div className="grid grid-cols-5 gap-3">
        {familyMembers.map((member) => (
          <button
            key={member.id}
            onClick={() =>
              setSelectedMemberId(
                selectedMemberId === member.id ? null : member.id
              )
            }
            className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
              selectedMemberId === member.id
                ? 'bg-slate-700 ring-2 ring-slate-400'
                : 'hover:bg-slate-800'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full ${getMemberColor(member.color)} flex items-center justify-center text-white font-bold text-sm`}
            >
              {member.initials}
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white">
                {getTokenCount(member.id)}
              </div>
              <div className="text-xs text-slate-400">tokens</div>
            </div>
          </button>
        ))}
      </div>

      {member && (
        <div className="mt-6 bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <div className="font-bold text-white mb-3">{member.name}'s History</div>
          <div className="space-y-2">
            {getMemberTokens(member.id).length === 0 ? (
              <p className="text-slate-400 text-sm">No token history yet</p>
            ) : (
              getMemberTokens(member.id)
                .reverse()
                .map((token) => (
                  <div key={token.id} className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">{token.reason}</span>
                    <span
                      className={`text-sm font-bold ${
                        token.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {token.amount > 0 ? '+' : ''}{token.amount}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
