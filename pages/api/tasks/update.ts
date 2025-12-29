import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface UpdateTaskRequest {
  taskId: string
  title?: string
  description?: string
  assignee_ids?: string[]
  recurrence_type?: 'once' | 'repeating'
  frequency?: 'daily' | 'every_two_days' | 'weekly' | 'monthly' | 'yearly'
  due_date?: string
  token_value?: number
  notes?: string
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
    const { taskId, ...updateData }: UpdateTaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }

    // Build update object, filtering out taskId
    const updates: Record<string, any> = {}
    if (updateData.title !== undefined) {
      updates.title = updateData.title?.trim() || ''
    }
    if (updateData.description !== undefined) {
      updates.description = updateData.description?.trim() || null
    }
    if (updateData.assignee_ids !== undefined) {
      updates.assignee_ids = updateData.assignee_ids
    }
    if (updateData.recurrence_type !== undefined) {
      updates.recurrence_type = updateData.recurrence_type
    }
    if (updateData.frequency !== undefined) {
      updates.frequency = updateData.frequency || null
    }
    if (updateData.due_date !== undefined) {
      updates.due_date = updateData.due_date || null
    }
    if (updateData.token_value !== undefined) {
      updates.token_value = updateData.token_value
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes?.trim() || null
    }
    if (updateData.completed !== undefined) {
      updates.completed = updateData.completed
    }
    if (updateData.completed_at !== undefined) {
      updates.completed_at = updateData.completed_at
    }
    if (updateData.completed_by !== undefined) {
      updates.completed_by = updateData.completed_by
    }
    if (updateData.completed_date !== undefined) {
      updates.completed_date = updateData.completed_date
    }

    updates.updated_at = new Date().toISOString()

    // Update task - cast supabase to any to bypass type checking
    const { data: task, error: taskError } = await (supabase as any)
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (taskError || !task) {
      console.error('Task update error:', taskError)
      return res.status(500).json({ error: 'Failed to update task' })
    }

    // Log activity
    const actorId = updateData.completed_by || 'system'
    await supabase.from('activity_log').insert({
      actor_id: actorId,
      action_type: updateData.completed ? 'task_completed' : 'task_edited',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        title: task.title,
        changes: Object.keys(updateData).filter(k => k !== 'taskId'),
      },
    } as any)

    return res.status(200).json(task as Task)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
