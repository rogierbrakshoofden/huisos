'use client'

import React from 'react'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Task, FamilyMember, RotationConfig } from '@/types/huisos-v2'

interface RotationAnalyticsPanelProps {
  tasks: Task[]
  rotationConfig: RotationConfig | null
  familyMembers: FamilyMember[]
  taskTitle?: string
}

interface MemberStats {
  memberId: string
  name: string
  completionCount: number
  lastCompletedDate?: string
}

export function RotationAnalyticsPanel({
  tasks,
  rotationConfig,
  familyMembers,
  taskTitle,
}: RotationAnalyticsPanelProps) {
  if (!rotationConfig || !rotationConfig.enabled || rotationConfig.rotation_order.length === 0) {
    return null
  }

  const getMemberName = (memberId: string): string => {
    return familyMembers.find((m) => m.id === memberId)?.name || 'Unknown'
  }

  // Calculate completion stats for this task
  const calculateStats = (): MemberStats[] => {
    const relevantTasks = tasks.filter((t) => t.rotation_config === rotationConfig)

    const stats: { [key: string]: MemberStats } = {}

    // Initialize all rotation members
    rotationConfig.rotation_order.forEach((memberId) => {
      if (!rotationConfig.skip_members.includes(memberId)) {
        stats[memberId] = {
          memberId,
          name: getMemberName(memberId),
          completionCount: 0,
        }
      }
    })

    // Count completions (this would need actual completion tracking in your data)
    // For now, we'll estimate based on rotation position
    relevantTasks.forEach((task) => {
      // This is a placeholder - you'd need actual completion history in your Task model
      // task.completion_history?.forEach(completion => {
      //   if (stats[completion.completed_by]) {
      //     stats[completion.completed_by].completionCount++
      //     stats[completion.completed_by].lastCompletedDate = completion.completed_at
      //   }
      // })
    })

    return Object.values(stats).sort((a, b) => b.completionCount - a.completionCount)
  }

  const calculateFairnessScore = (stats: MemberStats[]): number => {
    if (stats.length === 0) return 100

    const counts = stats.map((s) => s.completionCount)
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance =
      counts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / counts.length
    const stdDev = Math.sqrt(variance)

    // Score: 100 is perfect fairness, 0 is maximum unfairness
    // Formula: 100 - (stdDev / avg * 100) capped at 100
    if (avg === 0) return 100

    const fairnessScore = Math.max(0, 100 - (stdDev / avg) * 100)
    return Math.round(fairnessScore)
  }

  const suggestRebalance = (stats: MemberStats[]): string | null => {
    if (stats.length < 2) return null

    const max = Math.max(...stats.map((s) => s.completionCount))
    const min = Math.min(...stats.map((s) => s.completionCount))
    const diff = max - min

    if (diff > 2) {
      const overworked = stats.find((s) => s.completionCount === max)
      const underutilized = stats.find((s) => s.completionCount === min)
      return `${overworked?.name} has done this ${diff} more times than ${underutilized?.name}. Consider rebalancing.`
    }

    return null
  }

  const stats = calculateStats()
  const fairnessScore = calculateFairnessScore(stats)
  const rebalanceSuggestion = suggestRebalance(stats)

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={18} />
          Rotation Fairness
        </CardTitle>
        <CardDescription>
          {taskTitle && <>for "{taskTitle}"</>}
          {!taskTitle && <>Completion distribution across family members</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fairness Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Fairness Score</span>
            <span className={`text-lg font-bold ${fairnessScore >= 80 ? 'text-green-600' : fairnessScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {fairnessScore}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-300">
            <div
              className={`h-2 rounded-full transition-all ${
                fairnessScore >= 80
                  ? 'bg-green-500'
                  : fairnessScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${fairnessScore}%` }}
            />
          </div>
          <p className="text-xs text-slate-600">
            {fairnessScore >= 80 && '✓ Everyone is getting a fair share'}
            {fairnessScore >= 60 && fairnessScore < 80 && '⚠ Slightly unbalanced distribution'}
            {fairnessScore < 60 && '⚠ Significant imbalance detected'}
          </p>
        </div>

        {/* Completion Counts */}
        {stats.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Completions Per Person</p>
            <div className="space-y-2">
              {stats.map((stat) => (
                <div key={stat.memberId} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{stat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-20 rounded-full bg-slate-200">
                      <div
                        className="h-6 rounded-full bg-blue-500 flex items-center justify-center"
                        style={{ width: `${Math.max(10, ((stat.completionCount + 1) / (Math.max(...stats.map((s) => s.completionCount), 1) + 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-700">
                      {stat.completionCount}×
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rebalance Suggestion */}
        {rebalanceSuggestion && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-900">Suggestion</p>
                <p className="text-xs text-amber-800">{rebalanceSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-slate-500 border-t border-slate-200 pt-2">
          💡 Fairness is calculated based on completion history. Higher scores mean more balanced distribution.
        </p>
      </CardContent>
    </Card>
  )
}
