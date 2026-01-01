/**
 * Rotation Logic Utilities
 * 
 * Helper functions for rotation calculations, fairness metrics, and scheduling
 */

import type { RotationConfig, Task, FamilyMember } from '@/types/huisos-v2'
import { differenceInDays, isBefore, addWeeks, addMonths } from 'date-fns'

/**
 * Check if rotation should be shown for a task
 * Supports legacy rotation system (task-modal.tsx uses this)
 */
export function shouldShowRotation(input: any): boolean {
  if (!input) return false
  
  // New Phase 8 rotation system
  if (input.rotation_config?.enabled) return true
  
  // Legacy rotation system (task-modal.tsx)
  if (input.recurrence_type === 'repeating' && Array.isArray(input.assigned_to) && input.assigned_to.length > 1) {
    return true
  }
  
  return false
}

/**
 * Validate rotation config - supports both legacy and new systems
 * Legacy: validateRotationConfig(assigneeIds, excludeIds)
 * New: validateRotationConfig(config)
 */
export function validateRotationConfig(
  configOrAssigneeIds: RotationConfig | string[],
  excludeIds?: string[]
): string | null {
  // Legacy system (task-modal.tsx) - called with (assigneeIds, excludeIds)
  if (Array.isArray(configOrAssigneeIds)) {
    const assigneeIds = configOrAssigneeIds
    const exclude = excludeIds || []
    
    const eligible = assigneeIds.filter(id => !exclude.includes(id))
    if (eligible.length < 2) {
      return 'Rotation requires at least 2 eligible assignees (not excluded)'
    }
    return null
  }

  // New system (Phase 8) - called with config object
  const config = configOrAssigneeIds as RotationConfig
  const errors: string[] = []

  if (config.enabled) {
    if (config.rotation_order.length === 0) {
      errors.push('At least one person must be in the rotation order')
    }

    if (config.rotation_order.length < 2) {
      errors.push('Rotation requires at least 2 people')
    }

    if (config.current_index < 0 || config.current_index >= config.rotation_order.length) {
      errors.push('Current index is out of range')
    }

    const startDate = new Date(config.rotation_start_date)
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date')
    }
  }

  return errors.length > 0 ? errors.join('; ') : null
}

/**
 * Get the next assignee in rotation based on current config
 */
export function getNextAssignee(
  rotationConfig: RotationConfig,
  familyMembers: FamilyMember[]
): FamilyMember | null {
  if (!rotationConfig.enabled || rotationConfig.rotation_order.length === 0) {
    return null
  }

  let nextIndex = rotationConfig.current_index
  let attempts = 0
  const maxAttempts = rotationConfig.rotation_order.length

  while (attempts < maxAttempts) {
    const memberId = rotationConfig.rotation_order[nextIndex % rotationConfig.rotation_order.length]
    if (!rotationConfig.skip_members.includes(memberId)) {
      return familyMembers.find((m) => m.id === memberId) || null
    }
    nextIndex++
    attempts++
  }

  return null
}

/**
 * Get the current assignee (the one whose turn it is)
 */
export function getCurrentAssignee(
  rotationConfig: RotationConfig,
  familyMembers: FamilyMember[]
): FamilyMember | null {
  if (!rotationConfig.enabled || rotationConfig.rotation_order.length === 0) {
    return null
  }

  const memberId = rotationConfig.rotation_order[rotationConfig.current_index % rotationConfig.rotation_order.length]
  return familyMembers.find((m) => m.id === memberId) || null
}

/**
 * Get rotation cycle information
 */
export interface CycleInfo {
  cycleNumber: number
  positionInCycle: number
  cycleLength: number
  totalCycles: number
}

export function getCycleInfo(rotationConfig: RotationConfig): CycleInfo {
  const activeMembers = rotationConfig.rotation_order.filter(
    (id) => !rotationConfig.skip_members.includes(id)
  )
  const cycleLength = Math.max(1, activeMembers.length)
  const cycleNumber = Math.floor(rotationConfig.current_index / rotationConfig.rotation_order.length) + 1
  const positionInCycle = (rotationConfig.current_index % rotationConfig.rotation_order.length) + 1

  return {
    cycleNumber,
    positionInCycle,
    cycleLength,
    totalCycles: Math.ceil(rotationConfig.rotation_order.length / cycleLength),
  }
}

/**
 * Advance rotation to next person
 */
export function advanceRotation(rotationConfig: RotationConfig): RotationConfig {
  let nextIndex = rotationConfig.current_index + 1

  // If we've completed a full cycle, reset
  if (nextIndex >= rotationConfig.rotation_order.length) {
    nextIndex = 0
  }

  return {
    ...rotationConfig,
    current_index: nextIndex,
  }
}

/**
 * Reset rotation to first person
 */
export function resetRotation(rotationConfig: RotationConfig): RotationConfig {
  return {
    ...rotationConfig,
    current_index: 0,
  }
}

/**
 * Get when the next rotation should occur based on pattern
 */
export function getNextRotationDate(rotationConfig: RotationConfig): Date | null {
  if (!rotationConfig.enabled) return null

  const startDate = new Date(rotationConfig.rotation_start_date)

  switch (rotationConfig.pattern) {
    case 'weekly':
      return addWeeks(startDate, rotationConfig.current_index + 1)
    case 'monthly':
      return addMonths(startDate, rotationConfig.current_index + 1)
    case 'custom':
      return null // Manual rotation
    default:
      return null
  }
}

/**
 * Check if rotation is overdue (next person's turn has passed)
 */
export function isRotationOverdue(
  rotationConfig: RotationConfig,
  today: Date = new Date()
): boolean {
  const nextRotationDate = getNextRotationDate(rotationConfig)
  if (!nextRotationDate) return false

  return isBefore(nextRotationDate, today)
}

/**
 * Get days until next rotation
 */
export function daysUntilNextRotation(
  rotationConfig: RotationConfig,
  today: Date = new Date()
): number | null {
  const nextRotationDate = getNextRotationDate(rotationConfig)
  if (!nextRotationDate) return null

  return differenceInDays(nextRotationDate, today)
}

/**
 * Get rotation preview (upcoming assignees)
 */
export function getRotationPreview(
  rotationConfig: RotationConfig,
  familyMembers: FamilyMember[],
  count: number = 5
): FamilyMember[] {
  if (!rotationConfig.enabled || rotationConfig.rotation_order.length === 0) {
    return []
  }

  const preview: FamilyMember[] = []
  let index = rotationConfig.current_index

  for (let i = 0; i < count; i++) {
    const memberId = rotationConfig.rotation_order[index % rotationConfig.rotation_order.length]
    if (!rotationConfig.skip_members.includes(memberId)) {
      const member = familyMembers.find((m) => m.id === memberId)
      if (member) preview.push(member)
    }
    index++
  }

  return preview
}

/**
 * Calculate fairness score based on completion history
 * (You'll need to track completions in your Task model)
 */
export interface CompletionStats {
  memberId: string
  completionCount: number
  lastCompletedDate?: Date
}

export function calculateFairnessScore(stats: CompletionStats[]): number {
  if (stats.length === 0) return 100

  const counts = stats.map((s) => s.completionCount)
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length
  const variance = counts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / counts.length
  const stdDev = Math.sqrt(variance)

  if (avg === 0) return 100

  const fairnessScore = Math.max(0, 100 - (stdDev / avg) * 100)
  return Math.round(fairnessScore)
}

/**
 * Get rebalancing suggestion based on completion stats
 */
export function getRebalanceSuggestion(
  stats: CompletionStats[],
  familyMembers: FamilyMember[]
): string | null {
  if (stats.length < 2) return null

  const max = Math.max(...stats.map((s) => s.completionCount))
  const min = Math.min(...stats.map((s) => s.completionCount))
  const diff = max - min

  if (diff > 2) {
    const overworked = stats.find((s) => s.completionCount === max)
    const underutilized = stats.find((s) => s.completionCount === min)

    const overworkedName = familyMembers.find((m) => m.id === overworked?.memberId)?.name || 'One member'
    const underutilizedName = familyMembers.find((m) => m.id === underutilized?.memberId)?.name || 'another member'

    return `${overworkedName} has done this ${diff} more times than ${underutilizedName}. Consider rebalancing the rotation order.`
  }

  return null
}

/**
 * Merge rotation configs (for combining task defaults with instance overrides)
 */
export function mergeRotationConfigs(
  defaultConfig: RotationConfig,
  overrideConfig: Partial<RotationConfig>
): RotationConfig {
  return {
    ...defaultConfig,
    ...overrideConfig,
  }
}

/**
 * Export rotation schedule as text (for sharing, logging, etc.)
 */
export function exportRotationSchedule(
  rotationConfig: RotationConfig,
  familyMembers: FamilyMember[],
  title: string,
  cyclesCount: number = 3
): string {
  if (!rotationConfig.enabled) return 'Rotation not enabled'

  const lines: string[] = [
    `Task: ${title}`,
    `Pattern: ${rotationConfig.pattern}`,
    `Start Date: ${rotationConfig.rotation_start_date}`,
    ``,
    `Rotation Schedule:`,
    `==================`,
  ]

  const preview = getRotationPreview(rotationConfig, familyMembers, cyclesCount * rotationConfig.rotation_order.length)

  preview.forEach((member, index) => {
    const cycleNum = Math.floor(index / rotationConfig.rotation_order.length) + 1
    const posNum = (index % rotationConfig.rotation_order.length) + 1
    lines.push(
      `${rotationConfig.pattern === 'weekly' ? 'Week' : 'Month'} ${cycleNum}, Position ${posNum}: ${member.name}`
    )
  })

  return lines.join('\n')
}
