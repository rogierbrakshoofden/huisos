import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/tasks/update')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface UpdateTaskRequest {
  taskId: string
  title?: string
  assigned_to?: string | string[] | null
  due_date?: string | null
  note?: string | null
  completed?: boolean
  completed_at?: string | null
  recurrence_type?: 'once' | 'repeating'
  rotation_enabled?: boolean
  rotation_exclude_ids?: string[]
  rotation_index?: number
  [key: string]: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Task | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials.',
      })
    }

    const { taskId, ...updateData }: UpdateTaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }

    // Fetch original task for comparison
    const fetchResult: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('id', taskId)
      .single()

    const originalTask = fetchResult.data
    if (!originalTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Build update object with only valid columns
    const updates: Record<string, any> = {}
    
    if (updateData.title !== undefined) {
      updates.title = updateData.title?.trim() || ''
    }
    
    if (updateData.assigned_to !== undefined) {
      // Handle array or string, convert to array
      let assignedToArray: string[] = []
      if (Array.isArray(updateData.assigned_to)) {
        assignedToArray = updateData.assigned_to.filter(id => id && id.trim())
      } else if (typeof updateData.assigned_to === 'string') {
        assignedToArray = [updateData.assigned_to]
      }
      
      // Validate at least one assignee
      if (assignedToArray.length === 0) {
        return res.status(400).json({ error: 'At least one assignee is required' })
      }
      
      updates.assigned_to = assignedToArray
      
      // Track assignee changes for activity log
      const originalIds = Array.isArray(originalTask.assigned_to) 
        ? originalTask.assigned_to 
        : originalTask.assigned_to ? [originalTask.assigned_to] : []
      const added = assignedToArray.filter(id => !originalIds.includes(id))
      const removed = originalIds.filter(id => !assignedToArray.includes(id))
      
      if (added.length > 0 || removed.length > 0) {
        updateData._assigneeChanges = { added, removed }
      }
    }
    
    if (updateData.due_date !== undefined) {
      updates.due_date = updateData.due_date || null
    }
    if (updateData.note !== undefined) {
      updates.note = updateData.note?.trim() || null
    }
    if (updateData.completed !== undefined) {
      updates.completed = updateData.completed
    }
    if (updateData.completed_at !== undefined) {
      updates.completed_at = updateData.completed_at
    }
    if (updateData.recurrence_type !== undefined) {
      updates.recurrence_type = updateData.recurrence_type
    }
    if (updateData.rotation_enabled !== undefined) {
      updates.rotation_enabled = updateData.rotation_enabled
    }
    if (updateData.rotation_exclude_ids !== undefined) {
      updates.rotation_exclude_ids = updateData.rotation_exclude_ids || []
    }
    if (updateData.rotation_index !== undefined) {
      updates.rotation_index = updateData.rotation_index
    }

    // Update task
    const result: any = await (supabase as any)
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    const task = result.data
    const taskError = result.error

    if (taskError || !task) {
      console.error('❌ Task update error:', taskError)
      return res.status(500).json({
        error: taskError?.message || 'Failed to update task',
      })
    }

    // Log activity
    const actorId = updateData.completed_by || updateData.updated_by || 'system'
    
    // Log assignee changes separately if they occurred
    if (updateData._assigneeChanges) {
      const { added, removed } = updateData._assigneeChanges
      await (supabase as any).from('activity_log').insert({
        actor_id: actorId,
        action_type: 'assignees_updated',
        entity_type: 'task',
        entity_id: task.id,
        metadata: {
          title: task.title,
          added,
          removed,
        },
      } as any)
    } else {
      // General update log
      await (supabase as any).from('activity_log').insert({
        actor_id: actorId,
        action_type: updateData.completed ? 'task_completed' : 'task_edited',
        entity_type: 'task',
        entity_id: task.id,
        metadata: {
          title: task.title,
        },
      } as any)
    }

    return res.status(200).json(task as Task)
  } catch (err) {
    console.error('❌ API error in /api/tasks/update:', err)
    return res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error',
    })
  }
}
