import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface CompleteTaskRequest {
  taskId: string
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
    const { taskId, completedBy }: CompleteTaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }
    if (!completedBy) {
      return res.status(400).json({ error: 'completedBy is required' })
    }

    // Fetch the task first to get token_value
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select()
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      console.error('Task fetch error:', fetchError)
      return res.status(404).json({ error: 'Task not found' })
    }

    const completedAt = new Date().toISOString()
    const completedDate = completedAt.split('T')[0]

    // Update task with completion info - cast update payload to any
    const updatePayload: any = {
      completed: true,
      completed_at: completedAt,
      completed_by: completedBy,
      completed_date: completedDate,
      updated_at: completedAt,
    }

    const { data: updatedTask, error: updateError } = await (supabase as any)
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError || !updatedTask) {
      console.error('Task update error:', updateError)
      return res.status(500).json({ error: 'Failed to complete task' })
    }

    // Award tokens if task has a token value
    if (task.token_value && task.token_value > 0) {
      const { data: tokenRecord, error: tokenError } = await supabase
        .from('tokens')
        .insert({
          member_id: completedBy,
          amount: task.token_value,
          reason: `Task completion: ${task.title}`,
          task_completion_id: taskId,
        } as any)
        .select()
        .single()

      if (tokenError) {
        console.error('Token insert error:', tokenError)
        // Continue anyway - token awarding failure shouldn't break completion
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: completedBy,
      action_type: 'task_completed',
      entity_type: 'task',
      entity_id: taskId,
      metadata: {
        title: task.title,
        token_value_awarded: task.token_value || 0,
      },
    } as any)

    return res.status(200).json(updatedTask as Task)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
