'use client'

import React from 'react'
import { format } from 'date-fns'
import type { RotationConfig, FamilyMember } from '@/types/huisos-v2'

interface RotationPreviewProps {
  rotationConfig: RotationConfig | null
  familyMembers: FamilyMember[]
  compact?: boolean
  showCycleInfo?: boolean
}

export function RotationPreview({
  rotationConfig,
  familyMembers,
  compact = false,
  showCycleInfo = true,
}: RotationPreviewProps) {
  if (!rotationConfig || !rotationConfig.enabled || rotationConfig.rotation_order.length === 0) {
    return null
  }

  const getMemberName = (memberId: string): string => {
    return familyMembers.find((m) => m.id === memberId)?.name || 'Unknown'
  }

  const getMemberInitial = (memberId: string): string => {
    return getMemberName(memberId).charAt(0).toUpperCase()
  }

  const getNextAssignee = (): { name: string; memberId: string } | null => {
    if (rotationConfig.rotation_order.length === 0) return null

    let nextIndex = rotationConfig.current_index
    let attempts = 0
    const maxAttempts = rotationConfig.rotation_order.length

    while (attempts < maxAttempts) {
      const memberId = rotationConfig.rotation_order[nextIndex % rotationConfig.rotation_order.length]
      if (!rotationConfig.skip_members.includes(memberId)) {
        return { name: getMemberName(memberId), memberId }
      }
      nextIndex++
      attempts++
    }

    return null
  }

  const getRotationCycleInfo = () => {
    const activeMembers = rotationConfig.rotation_order.filter(
      (id) => !rotationConfig.skip_members.includes(id)
    )
    const cycleLength = activeMembers.length
    const cycleNumber = Math.floor(rotationConfig.current_index / rotationConfig.rotation_order.length) + 1
    const positionInCycle = (rotationConfig.current_index % rotationConfig.rotation_order.length) + 1

    return {
      cycleNumber,
      positionInCycle,
      cycleLength,
      totalCycles: Math.ceil(rotationConfig.rotation_order.length / cycleLength),
    }
  }

  const nextAssignee = getNextAssignee()
  const cycleInfo = showCycleInfo ? getRotationCycleInfo() : null

  if (!nextAssignee) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">Next:</span>
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {getMemberInitial(nextAssignee.memberId)}
          </div>
          <span className="text-sm font-medium text-slate-700">{nextAssignee.name}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Next Assignee
            </span>
            {cycleInfo && (
              <span className="text-xs text-blue-600">
                Cycle {cycleInfo.cycleNumber} • Position {cycleInfo.positionInCycle}/{cycleInfo.cycleLength}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
              {getMemberInitial(nextAssignee.memberId)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{nextAssignee.name}</p>
              <p className="text-xs text-blue-700">
                {rotationConfig.pattern === 'weekly' && 'Rotation every Monday'}
                {rotationConfig.pattern === 'monthly' && 'Rotation every 1st of month'}
                {rotationConfig.pattern === 'custom' && 'Manual rotation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Show next few in rotation */}
      <div className="text-xs text-slate-600">
        <p className="mb-2 font-medium">Upcoming:</p>
        <div className="space-y-1">
          {rotationConfig.rotation_order.map((memberId, index) => {
            if (index > 3) return null // Show max 4 people
            const isCurrent = index === rotationConfig.current_index % rotationConfig.rotation_order.length
            const isSkipped = rotationConfig.skip_members.includes(memberId)

            if (isSkipped) return null

            return (
              <div key={memberId} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className={isCurrent ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                  {getMemberName(memberId)}
                </span>
                {isCurrent && <span className="text-xs text-green-600 font-semibold">Now</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
