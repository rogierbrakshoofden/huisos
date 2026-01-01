'use client'

import React, { useState, useEffect } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RotationConfig, FamilyMember } from '@/types/huisos-v2'

interface RotationConfigSectionProps {
  rotationConfig: RotationConfig | null
  familyMembers: FamilyMember[]
  taskTitle: string
  onConfigChange: (config: RotationConfig) => void
  disabled?: boolean
}

const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  enabled: false,
  pattern: 'weekly',
  rotation_order: [],
  current_index: 0,
  skip_members: [],
  rotation_start_date: new Date().toISOString().split('T')[0],
}

export function RotationConfigSection({
  rotationConfig,
  familyMembers,
  taskTitle,
  onConfigChange,
  disabled = false,
}: RotationConfigSectionProps) {
  const [config, setConfig] = useState<RotationConfig>(
    rotationConfig || DEFAULT_ROTATION_CONFIG
  )

  // Initialize rotation order with all family members if creating new
  useEffect(() => {
    if (!rotationConfig && familyMembers.length > 0) {
      const initialOrder = familyMembers.map((m) => m.id)
      setConfig((prev) => ({
        ...prev,
        rotation_order: initialOrder,
      }))
    }
  }, [familyMembers, rotationConfig])

  const handleToggleRotation = (enabled: boolean) => {
    const newConfig = { ...config, enabled }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handlePatternChange = (pattern: 'weekly' | 'monthly' | 'custom') => {
    const newConfig = { ...config, pattern }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleRotationOrderChange = (fromIndex: number, toIndex: number) => {
    const newOrder = Array.from(config.rotation_order)
    const [moved] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, moved)

    const newConfig = { ...config, rotation_order: newOrder }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleSkipMemberChange = (memberId: string, skip: boolean) => {
    const newSkipMembers = skip
      ? [...config.skip_members, memberId]
      : config.skip_members.filter((id) => id !== memberId)

    const newConfig = { ...config, skip_members: newSkipMembers }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleStartDateChange = (date: string) => {
    const newConfig = { ...config, rotation_start_date: date }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleResetRotationIndex = () => {
    const newConfig = { ...config, current_index: 0 }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const getMemberName = (memberId: string) => {
    return familyMembers.find((m) => m.id === memberId)?.name || 'Unknown'
  }

  const getNextAssignee = (): string | null => {
    if (!config.enabled || config.rotation_order.length === 0) return null

    let nextIndex = config.current_index
    let attempts = 0
    const maxAttempts = config.rotation_order.length

    // Skip members who are in skip_members list
    while (attempts < maxAttempts) {
      const memberId = config.rotation_order[nextIndex % config.rotation_order.length]
      if (!config.skip_members.includes(memberId)) {
        return memberId
      }
      nextIndex++
      attempts++
    }

    return null
  }

  const getRotationPreview = (): string[] => {
    if (!config.enabled || config.rotation_order.length === 0) return []

    const preview: string[] = []
    let index = config.current_index
    const cycleLength = Math.max(1, config.rotation_order.length - config.skip_members.length)

    for (let i = 0; i < Math.min(cycleLength, 5); i++) {
      const memberId = config.rotation_order[index % config.rotation_order.length]
      if (!config.skip_members.includes(memberId)) {
        preview.push(getMemberName(memberId))
      }
      index++
    }

    return preview
  }

  const rotationPreview = getRotationPreview()
  const nextAssignee = getNextAssignee()

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Rotation & Sharing</Label>
          <Toggle
            pressed={config.enabled}
            onPressedChange={handleToggleRotation}
            disabled={disabled}
            aria-label="Enable rotation"
            className="data-[state=on]:bg-blue-600"
          >
            {config.enabled ? 'On' : 'Off'}
          </Toggle>
        </div>
        <p className="text-sm text-slate-600">
          Automatically rotate this task between family members on a schedule
        </p>
      </div>

      {config.enabled && (
        <div className="space-y-4">
          {/* Pattern Selection */}
          <div className="space-y-2">
            <Label htmlFor="rotation-pattern" className="text-sm font-medium">
              Rotation Pattern
            </Label>
            <Select value={config.pattern} onValueChange={handlePatternChange} disabled={disabled}>
              <SelectTrigger id="rotation-pattern" className="w-full">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom (manual)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {config.pattern === 'weekly' && 'Rotation happens every Monday'}
              {config.pattern === 'monthly' && 'Rotation happens on the 1st of each month'}
              {config.pattern === 'custom' && 'Rotate manually using the advance button'}
            </p>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="rotation-start-date" className="text-sm font-medium">
              Start Date
            </Label>
            <Input
              id="rotation-start-date"
              type="date"
              value={config.rotation_start_date}
              onChange={(e) => handleStartDateChange(e.target.value)}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              First rotation begins on {format(new Date(config.rotation_start_date), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Rotation Order (Simplified - no drag-drop) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Rotation Order</Label>
            {config.rotation_order.length > 0 ? (
              <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                {config.rotation_order.map((memberId, index) => (
                  <div
                    key={memberId}
                    className="flex items-center gap-3 rounded border border-slate-200 p-2 bg-white"
                  >
                    <span className="font-semibold text-slate-500 text-sm">{index + 1}.</span>
                    <span className="flex-1 font-medium text-slate-700">{getMemberName(memberId)}</span>
                    {index === config.current_index && (
                      <span className="text-xs rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No family members assigned to task</p>
            )}
          </div>

          {/* Skip Members */}
          {config.rotation_order.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Skip Members</Label>
              <p className="text-xs text-slate-500">
                Skip selected members during rotation (useful for guests or inactive members)
              </p>
              <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                {config.rotation_order.map((memberId) => (
                  <div key={memberId} className="flex items-center gap-3">
                    <Checkbox
                      id={`skip-${memberId}`}
                      checked={config.skip_members.includes(memberId)}
                      onCheckedChange={(checked) =>
                        handleSkipMemberChange(memberId, checked as boolean)
                      }
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`skip-${memberId}`}
                      className="flex-1 cursor-pointer font-medium text-slate-700"
                    >
                      {getMemberName(memberId)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rotation Preview */}
          {rotationPreview.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upcoming Rotation</Label>
              <div className="space-y-1 rounded-md bg-blue-50 p-3">
                {rotationPreview.map((name, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-semibold text-slate-700">
                      {config.pattern === 'weekly' && `Week ${index + 1}: `}
                      {config.pattern === 'monthly' && `Month ${index + 1}: `}
                      {config.pattern === 'custom' && `#${index + 1}: `}
                    </span>
                    <span className="text-slate-600">{name}</span>
                    {index === 0 && (
                      <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Next
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Current Index */}
          {config.current_index > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRotationIndex}
              disabled={disabled}
              className="w-full text-xs"
            >
              Reset to First Person
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
