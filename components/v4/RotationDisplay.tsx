'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, AlertCircle } from 'lucide-react'
import type { RotationConfig, FamilyMember, Task } from '@/types/huisos-v2'

interface RotationDisplayProps {
  task: Task
  rotationConfig: RotationConfig | null
  familyMembers: FamilyMember[]
  onAdvanceRotation?: (taskId: string) => Promise<void>
  loading?: boolean
}

export function RotationDisplay({
  task,
  rotationConfig,
  familyMembers,
  onAdvanceRotation,
  loading = false,
}: RotationDisplayProps) {
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false)

  if (!rotationConfig || !rotationConfig.enabled) {
    return null
  }

  const getMemberName = (memberId: string): string => {
    return familyMembers.find((m) => m.id === memberId)?.name || 'Unknown'
  }

  const getMemberInitial = (memberId: string): string => {
    return getMemberName(memberId).charAt(0).toUpperCase()
  }

  const getNextAssignee = (): string | null => {
    if (rotationConfig.rotation_order.length === 0) return null

    let nextIndex = rotationConfig.current_index
    let attempts = 0
    const maxAttempts = rotationConfig.rotation_order.length

    while (attempts < maxAttempts) {
      const memberId = rotationConfig.rotation_order[nextIndex % rotationConfig.rotation_order.length]
      if (!rotationConfig.skip_members.includes(memberId)) {
        return memberId
      }
      nextIndex++
      attempts++
    }

    return null
  }

  const getCycleInfo = () => {
    const activeMembers = rotationConfig.rotation_order.filter(
      (id) => !rotationConfig.skip_members.includes(id)
    )
    const cycleNumber = Math.floor(rotationConfig.current_index / rotationConfig.rotation_order.length) + 1
    const positionInCycle = (rotationConfig.current_index % rotationConfig.rotation_order.length) + 1

    return {
      cycleNumber,
      positionInCycle,
      cycleLength: activeMembers.length,
    }
  }

  const handleAdvanceRotation = async () => {
    if (onAdvanceRotation) {
      await onAdvanceRotation(task.id)
      setShowAdvanceConfirm(false)
    }
  }

  const nextAssignee = getNextAssignee()
  const cycleInfo = getCycleInfo()

  if (!nextAssignee) {
    return null
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
            {getMemberInitial(nextAssignee)}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Next Rotation
            </p>
            <p className="font-semibold text-slate-900">{getMemberName(nextAssignee)}</p>
            <p className="text-xs text-amber-600">
              Cycle {cycleInfo.cycleNumber} • Step {cycleInfo.positionInCycle}/{cycleInfo.cycleLength}
            </p>
          </div>
        </div>

        {onAdvanceRotation && (
          <div className="flex flex-col gap-1">
            {!showAdvanceConfirm ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAdvanceConfirm(true)}
                disabled={loading}
                className="border-amber-300 hover:bg-amber-100 text-xs"
              >
                <ChevronRight size={14} className="mr-1" />
                Advance
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAdvanceRotation}
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs"
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAdvanceConfirm(false)}
                  disabled={loading}
                  className="border-amber-300 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pattern info */}
      <div className="text-xs text-amber-700 border-t border-amber-200 pt-2">
        {rotationConfig.pattern === 'weekly' && (
          <p>⏰ Rotates every Monday — Pattern: {rotationConfig.rotation_order.map((id) => getMemberInitial(id)).join(' → ')}</p>
        )}
        {rotationConfig.pattern === 'monthly' && (
          <p>⏰ Rotates on 1st of month — Pattern: {rotationConfig.rotation_order.map((id) => getMemberInitial(id)).join(' → ')}</p>
        )}
        {rotationConfig.pattern === 'custom' && (
          <p>⏰ Manual rotation — Pattern: {rotationConfig.rotation_order.map((id) => getMemberInitial(id)).join(' → ')}</p>
        )}
      </div>
    </div>
  )
}
