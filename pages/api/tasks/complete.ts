import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/tasks/complete')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface CompleteTaskRequest {
  taskId: string
  completedBy: string
}

// Inline rotation helper function
function getNextRotationIndex(
  currentIndex: number,
  assigneeIds: string[],
  excludeIds: string[] = []
): number {
  if (assigneeIds.length === 0) return 0
  
  let nextIndex = currentIndex + 1
  let attempts = 0
  const maxAttempts = assigneeIds.length

  // Find the next non-excluded assignee
  while (attempts < maxAttempts) {
    const candidateId = assigneeIds[nextIndex % assigneeIds.length]
    if (!excludeIds.includes(candidateId)) {
      return nextIndex % assigneeIds.length
    }
    nextIndex++
    attempts++
  }

  // If all are excluded, just return next index
  return (currentIndex + 1) % assigneeIds.length
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Task | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials.',
      })
    }

    // Extract household_id from request header
    const householdId = req.headers['x-household-id'] as string
    if (!householdId) {
      return res.status(401).json({ error: 'Unauthorized: missing household ID' })
    }

    const { taskId, completedBy }: CompleteTaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }
    if (!completedBy) {
      return res.status(400).json({ error: 'completedBy is required' })
    }

    // Fetch the task first (with household_id check via RLS)
    const result: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('id', taskId)
      .eq('household_id', householdId)
      .single()

    const taskData = result.data
    const fetchError = result.error

    if (fetchError || !taskData) {
      console.error('❌ Task fetch error:', fetchError)
      return res.status(404).json({ error: 'Task not found' })
    }

    const task = taskData as Task
    const completedAt = new Date().toISOString()

    // Check if rotation is enabled for repeating tasks
    const shouldRotate = 
      task.recurrence_type === 'repeating' && 
      task.rotation_enabled && 
      Array.isArray(task.assigned_to) &&
      task.assigned_to.length > 1

    let updatePayload: any = {
      completed: true,
      completed_at: completedAt,
    }

    // Handle rotation if enabled
    if (shouldRotate) {
      const currentIndex = task.rotation_index || 0
      const nextIndex = getNextRotationIndex(
        currentIndex,
        task.assigned_to,
        task.rotation_exclude_ids || []
      )

      // For repeating tasks with rotation, reset completion and advance rotation
      updatePayload = {
        completed: false,
        completed_at: null,
        rotation_index: nextIndex,
      }

      // Store previous and next assignee for logging
      const previousAssignee = task.assigned_to[currentIndex]
      const nextAssignee = task.assigned_to[nextIndex]

      // Update task (RLS will enforce household isolation)
      const updateResult: any = await (supabase as any)
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('household_id', householdId)
        .select()
        .single()

      const updatedTask = updateResult.data
      const updateError = updateResult.error

      if (updateError || !updatedTask) {
        console.error('❌ Task update error:', updateError)
        return res.status(500).json({
          error: updateError?.message || 'Failed to complete task',
        })
      }

      // Award tokens to the person who completed it
      const tokenValue = task.token_value || 1
      if (tokenValue > 0) {
        await (supabase as any).from('tokens').insert({
          member_id: completedBy,
          amount: tokenValue,
          reason: `Completed: ${task.title}`,
          task_id: taskId,
          household_id: householdId,
        } as any)
      }

      // Log task completion
      await (supabase as any).from('activity_log').insert({
        actor_id: completedBy,
        action_type: 'task_completed',
        entity_type: 'task',
        entity_id: taskId,
        household_id: householdId,
        metadata: {
          title: task.title,
          token_value_awarded: tokenValue,
        },
      } as any)

      // Log rotation event
      await (supabase as any).from('activity_log').insert({
        actor_id: completedBy,
        action_type: 'task_rotated',
        entity_type: 'task',
        entity_id: taskId,
        household_id: householdId,
        metadata: {
          title: task.title,
          previous_assignee: previousAssignee,
          next_assignee: nextAssignee,
        },
      } as any)

      return res.status(200).json(updatedTask as Task)
    } else {
      // Standard completion (no rotation)
      const updateResult: any = await (supabase as any)
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('household_id', householdId)
        .select()
        .single()

      const updatedTask = updateResult.data
      const updateError = updateResult.error

      if (updateError || !updatedTask) {
        console.error('❌ Task update error:', updateError)
        return res.status(500).json({
          error: updateError?.message || 'Failed to complete task',
        })
      }

      // Award tokens to the person who completed it
      const tokenValue = task.token_value || 1
      if (tokenValue > 0) {
        await (supabase as any).from('tokens').insert({
          member_id: completedBy,
          amount: tokenValue,
          reason: `Completed: ${task.title}`,
          task_id: taskId,
          household_id: householdId,
        } as any)
      }

      // Log activity
      await (supabase as any).from('activity_log').insert({
        actor_id: completedBy,
        action_type: 'task_completed',
        entity_type: 'task',
        entity_id: taskId,
        household_id: householdId,
        metadata: {
          title: task.title,
          token_value_awarded: tokenValue,
        },
      } as any)

      return res.status(200).json(updatedTask as Task)
    }
  } catch (err) {
    console.error('❌ API error in /api/tasks/complete:', err)
    return res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error',
    })
  }
}
