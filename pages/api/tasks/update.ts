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

    // Build update object with only valid columns
    const updates: Record<string, any> = {}
    
    if (updateData.title !== undefined) {
      updates.title = updateData.title?.trim() || ''
    }
    if (updateData.assigned_to !== undefined) {
      // Handle array or string
      if (Array.isArray(updateData.assigned_to) && updateData.assigned_to.length > 0) {
        updates.assigned_to = updateData.assigned_to[0]
      } else if (typeof updateData.assigned_to === 'string') {
        updates.assigned_to = updateData.assigned_to
      } else {
        updates.assigned_to = null
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

    updates.updated_at = new Date().toISOString()

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
    const actorId = updateData.completed_by || 'system'
    await (supabase as any).from('activity_log').insert({
      actor_id: actorId,
      action_type: updateData.completed ? 'task_completed' : 'task_updated',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        title: task.title,
      },
    } as any)

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
