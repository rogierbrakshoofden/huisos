import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface CreateTaskRequest {
  title: string
  description?: string
  assignee_ids: string[]
  recurrence_type: 'once' | 'repeating'
  frequency?: 'daily' | 'every_two_days' | 'weekly' | 'monthly' | 'yearly'
  due_date?: string
  token_value: number
  notes?: string
  created_by: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Task | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      title,
      description,
      assignee_ids,
      recurrence_type,
      frequency,
      due_date,
      token_value,
      notes,
      created_by,
    }: CreateTaskRequest = req.body

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!assignee_ids || assignee_ids.length === 0) {
      return res.status(400).json({ error: 'At least one assignee is required' })
    }
    if (!created_by) {
      return res.status(400).json({ error: 'created_by is required' })
    }

    // Insert task - cast payload to any
    const insertPayload: any = {
      title: title.trim(),
      description: description?.trim() || null,
      assignee_ids,
      recurrence_type,
      frequency: recurrence_type === 'repeating' ? frequency : null,
      due_date: recurrence_type === 'once' ? due_date : null,
      token_value,
      notes: notes?.trim() || null,
      created_by,
      completed: false,
      rotation_enabled: false,
      rotation_index: 0,
      rotation_exclude_ids: [],
    }

    const result: any = await (supabase as any)
      .from('tasks')
      .insert(insertPayload)
      .select()
      .single()

    const task = result.data
    const taskError = result.error

    if (taskError || !task) {
      console.error('Task insert error:', taskError)
      return res.status(500).json({ error: 'Failed to create task' })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: created_by,
      action_type: 'task_created',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        title: task.title,
        token_value: task.token_value,
        recurrence_type: task.recurrence_type,
      },
    } as any)

    return res.status(201).json(task as Task)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
