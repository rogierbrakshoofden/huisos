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

    const { taskId, completedBy }: CompleteTaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }
    if (!completedBy) {
      return res.status(400).json({ error: 'completedBy is required' })
    }

    // Fetch the task first to get token_value
    const result: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('id', taskId)
      .single()

    const taskData = result.data
    const fetchError = result.error

    if (fetchError || !taskData) {
      console.error('❌ Task fetch error:', fetchError)
      return res.status(404).json({ error: 'Task not found' })
    }

    const task = taskData as Task

    const completedAt = new Date().toISOString()
    const completedDate = completedAt.split('T')[0]

    // Update task with completion info
    const updateResult: any = await (supabase as any)
      .from('tasks')
      .update({
        completed: true,
        completed_at: completedAt,
        completed_by: completedBy,
        completed_date: completedDate,
        updated_at: completedAt,
      })
      .eq('id', taskId)
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
        console.error('⚠️ Token insert error:', tokenError)
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

    // Auto-rotate if enabled
    if (task.rotation_enabled && task.assignee_ids && task.assignee_ids.length > 0) {
      const availableAssignees = task.assignee_ids.filter(
        (id) => !(task.rotation_exclude_ids || []).includes(id)
      )

      if (availableAssignees.length > 0) {
        const currentIndex = task.rotation_index || 0
        const nextIndex = (currentIndex + 1) % availableAssignees.length
        const nextAssigneeId = availableAssignees[nextIndex]

        // Call rotation endpoint
        try {
          const appUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000'

          const rotateRes = await fetch(`${appUrl}/api/tasks/rotate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: taskId,
              nextAssigneeId: nextAssigneeId,
              completedBy: completedBy,
            }),
          })

          if (!rotateRes.ok) {
            console.warn('⚠️ Rotation failed:', await rotateRes.text())
            // Don't fail the completion, just warn
          }
        } catch (err) {
          console.warn('⚠️ Rotation error:', err)
        }
      }
    }

    return res.status(200).json(updatedTask as Task)
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
