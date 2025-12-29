import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface RotateTaskRequest {
  taskId: string
  nextAssigneeId: string
  completedBy: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Task | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { taskId, nextAssigneeId, completedBy }: RotateTaskRequest = req.body

    if (!taskId || !nextAssigneeId || !completedBy) {
      return res.status(400).json({ error: 'taskId, nextAssigneeId, and completedBy are required' })
    }

    // Fetch original task
    const taskResult: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('id', taskId)
      .single()

    const task = taskResult.data as Task
    const taskError = taskResult.error

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Validate rotation is enabled
    if (!task.rotation_enabled) {
      return res.status(400).json({ error: 'Task does not have rotation enabled' })
    }

    // Calculate next rotation index
    const nextIndex = (task.rotation_index || 0) + 1

    // Create new rotated task
    const newTaskData = {
      title: task.title,
      description: task.description,
      assignee_ids: [nextAssigneeId],
      recurrence_type: 'repeating',
      frequency: task.frequency,
      due_date: task.due_date,
      token_value: task.token_value,
      notes: task.notes,
      created_by: task.created_by,
      rotation_enabled: task.rotation_enabled,
      rotation_index: nextIndex,
      rotation_exclude_ids: task.rotation_exclude_ids,
      parent_task_id: taskId,
    }

    const createResult: any = await (supabase as any)
      .from('tasks')
      .insert(newTaskData)
      .select()
      .single()

    const newTask = createResult.data as Task
    const createError = createResult.error

    if (createError || !newTask) {
      console.error('Task rotation create error:', createError)
      return res.status(500).json({ error: 'Failed to create rotated task' })
    }

    // Update parent task's rotation_index
    await supabase
      .from('tasks')
      .update({ rotation_index: nextIndex })
      .eq('id', taskId)

    // Get next assignee name for activity log
    const memberResult: any = await (supabase as any)
      .from('family_members')
      .select('name')
      .eq('id', nextAssigneeId)
      .single()

    const nextAssigneeName = memberResult.data?.name || 'Next member'

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: completedBy,
      action_type: 'task_rotated',
      entity_type: 'task',
      entity_id: taskId,
      metadata: {
        title: task.title,
        from_index: task.rotation_index,
        to_index: nextIndex,
        assigned_to: nextAssigneeName,
      },
    } as any)

    return res.status(200).json(newTask)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
