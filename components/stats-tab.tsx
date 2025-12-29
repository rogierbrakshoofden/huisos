'use client'

import { useEffect, useState } from 'react'
import { FamilyMember } from '@/types/huisos-v2'
import { PresenceIndicator } from './presence-indicator'

interface LeaderboardEntry {
  rank: number
  memberId: string
  memberName: string
  memberColor: string
  memberInitials: string
  tokenCount: number
  tasksCompleted: number
}

interface MemberStats {
  memberId: string
  memberName: string
  tasksCompletedThisMonth: number
  tasksCompletedAllTime: number
  avgTokensPerTask: number
  currentStreak: number
  longestStreak: number
  mostFrequentChore: string
  totalTokens: number
}

interface FamilyStats {
  totalTasksCompletedThisMonth: number
  totalTasksCompletedAllTime: number
  avgTasksPerMember: number
  mostPopularChore: string
  totalFamilyTokens: number
  familyMemberCount: number
}

interface StatsTabProps {
  familyMembers: FamilyMember[]
  currentUserId: string
  presence: Record<string, { is_home: boolean; note?: string }>
}

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉']

const getMemberColor = (color: string) => {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-600',
  }
  return colorMap[color] || 'bg-slate-600'
}

export function StatsTab({
  familyMembers,
  currentUserId,
  presence,
}: StatsTabProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch leaderboard
        const leaderRes = await fetch(`/api/stats/leaderboard?timeframe=${timeframe}`)
        if (leaderRes.ok) {
          const data = await leaderRes.json()
          setLeaderboard(data)
        }

        // Fetch current user's stats
        const memberRes = await fetch(
          `/api/stats/member-stats?memberId=${currentUserId}`
        )
        if (memberRes.ok) {
          const data = await memberRes.json()
          setMemberStats(data)
        }

        // Fetch family stats
        const familyRes = await fetch('/api/stats/family-stats')
        if (familyRes.ok) {
          const data = await familyRes.json()
          setFamilyStats(data)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeframe, currentUserId])

  const currentMember = familyMembers.find((m) => m.id === currentUserId)
  const presenceData = presence[currentUserId]

  return (
    <div className="pb-32 px-4 space-y-6">
      {/* Hero: Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">🏆 Leaderboard</h2>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No tasks completed yet
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.memberId}
                className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl font-bold w-8">
                    {entry.rank <= 3
                      ? MEDAL_EMOJIS[entry.rank - 1]
                      : `${entry.rank}`}
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full ${getMemberColor(entry.memberColor)} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {entry.memberInitials}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {entry.memberName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {entry.tasksCompleted} tasks
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">
                    {entry.tokenCount}
                  </div>
                  <div className="text-xs text-slate-400">tokens</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Stats */}
      {currentMember && memberStats && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">📊 Your Stats</h3>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">This Month</span>
              <span className="text-white font-semibold">
                ✓ {memberStats.tasksCompletedThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">All Time</span>
              <span className="text-white font-semibold">
                ✓ {memberStats.tasksCompletedAllTime}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-3"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Avg Tokens/Task</span>
              <span className="text-yellow-400 font-semibold">
                💰 {memberStats.avgTokensPerTask}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Current Streak</span>
              <span className="text-red-400 font-semibold">
                🔥 {memberStats.currentStreak} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Best Streak</span>
              <span className="text-orange-400 font-semibold">
                ⭐ {memberStats.longestStreak} days
              </span>
            </div>
            <div className="border-t border-slate-700 pt-3"></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Favorite Chore</span>
              <span className="text-white font-semibold">
                {memberStats.mostFrequentChore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Family Stats */}
      {familyStats && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">👨‍👩‍👧‍👦 Family Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">This Month</div>
              <div className="text-xl font-bold text-white">
                {familyStats.totalTasksCompletedThisMonth}
              </div>
              <div className="text-xs text-slate-400">tasks</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">All Time</div>
              <div className="text-xl font-bold text-white">
                {familyStats.totalTasksCompletedAllTime}
              </div>
              <div className="text-xs text-slate-400">tasks</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Avg/Person</div>
              <div className="text-xl font-bold text-white">
                {Math.round(familyStats.avgTasksPerMember)}
              </div>
              <div className="text-xs text-slate-400">tasks</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Total Tokens</div>
              <div className="text-xl font-bold text-yellow-400">
                {familyStats.totalFamilyTokens}
              </div>
              <div className="text-xs text-slate-400">earned</div>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Most Popular</div>
            <div className="text-lg font-bold text-white">
              {familyStats.mostPopularChore}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
