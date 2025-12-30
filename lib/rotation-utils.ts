// lib/rotation-utils.ts
// Rotation logic for multi-assignee tasks

import { Task, FamilyMember } from '@/types/huisos-v2'

/**
 * Calculate the next rotation index for a task
 * Skips excluded assignees and wraps around when reaching the end
 */
export function getNextRotationIndex(
  currentIndex: number,
  assigneeIds: string[],
  excludeIds: string[] = []
): number {
  // Filter out excluded assignees
  const eligibleAssignees = assigneeIds.filter(
    id => !excludeIds.includes(id)
  )
  
  // If no one is eligible, stay at current index
  if (eligibleAssignees.length === 0) {
    return currentIndex
  }
  
  // If only one eligible assignee, no rotation needed
  if (eligibleAssignees.length === 1) {
    return assigneeIds.indexOf(eligibleAssignees[0])
  }
  
  // Get current assignee ID (handle out of bounds)
  const safeCurrentIndex = Math.min(currentIndex, assigneeIds.length - 1)
  const currentAssigneeId = assigneeIds[safeCurrentIndex]
  
  // Find current assignee's position in eligible list
  const currentEligibleIdx = eligibleAssignees.indexOf(currentAssigneeId)
  
  // If current assignee is excluded, start from first eligible
  if (currentEligibleIdx === -1) {
    const nextAssigneeId = eligibleAssignees[0]
    return assigneeIds.indexOf(nextAssigneeId)
  }
  
  // Advance to next eligible assignee, wrap around if needed
  const nextEligibleIdx = (currentEligibleIdx + 1) % eligibleAssignees.length
  const nextAssigneeId = eligibleAssignees[nextEligibleIdx]
  
  // Map back to original assignee array index
  return assigneeIds.indexOf(nextAssigneeId)
}

/**
 * Get the current assignee for a task based on rotation index
 */
export function getCurrentAssignee(
  task: Task,
  familyMembers: FamilyMember[]
): FamilyMember | null {
  if (!task.assigned_to || task.assigned_to.length === 0) {
    return null
  }
  
  const rotationIndex = task.rotation_index ?? 0
  const safeIndex = Math.min(rotationIndex, task.assigned_to.length - 1)
  const currentId = task.assigned_to[safeIndex]
  
  return familyMembers.find(m => m.id === currentId) || null
}

/**
 * Get the next assignee for a rotating task
 */
export function getNextAssignee(
  task: Task,
  familyMembers: FamilyMember[]
): FamilyMember | null {
  if (!task.assigned_to || task.assigned_to.length === 0) {
    return null
  }
  
  const currentIndex = task.rotation_index ?? 0
  const nextIndex = getNextRotationIndex(
    currentIndex,
    task.assigned_to,
    task.rotation_exclude_ids || []
  )
  
  const nextId = task.assigned_to[nextIndex]
  return familyMembers.find(m => m.id === nextId) || null
}

/**
 * Check if a task should show rotation controls
 */
export function shouldShowRotation(
  task: Partial<Task>
): boolean {
  return (
    task.recurrence_type === 'repeating' &&
    (task.assigned_to?.length ?? 0) > 1
  )
}

/**
 * Validate rotation configuration
 * Returns error message if invalid, null if valid
 */
export function validateRotationConfig(
  assigneeIds: string[],
  excludeIds: string[]
): string | null {
  if (assigneeIds.length === 0) {
    return 'At least one assignee is required'
  }
  
  if (assigneeIds.length === 1 && excludeIds.length > 0) {
    return 'Cannot exclude the only assignee'
  }
  
  const eligibleCount = assigneeIds.filter(
    id => !excludeIds.includes(id)
  ).length
  
  if (eligibleCount === 0) {
    return 'At least one assignee must be eligible for rotation'
  }
  
  return null
}
