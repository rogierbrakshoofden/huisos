import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Task } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/tasks/create')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface CreateTaskRequest {
  title: string
  assigned_to?: string | string[]
  due_date?: string
  note?: string
  token_value?: number
  created_by: string
  recurrence_type?: 'once' | 'repeating'
  rotation_enabled?: boolean
  rotation_exclude_ids?: string[]
  rotation_index?: number
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
        error: 'Server configuration error: Missing Supabase credentials. Contact admin.',
      })
    }

    const { 
      title, 
      assigned_to, 
      due_date, 
      note,
      token_value,
      created_by,
      recurrence_type,
      rotation_enabled,
      rotation_exclude_ids,
      rotation_index
    }: CreateTaskRequest = req.body

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!created_by) {
      return res.status(400).json({ error: 'created_by is required' })
    }

    // Convert assigned_to to array format
    let assignedToArray: string[] = []
    if (assigned_to) {
      if (Array.isArray(assigned_to)) {
        assignedToArray = assigned_to.filter(id => id && id.trim())
      } else if (typeof assigned_to === 'string') {
        assignedToArray = [assigned_to]
      }
    }

    // Validate at least one assignee
    if (assignedToArray.length === 0) {
      return res.status(400).json({ error: 'At least one assignee is required' })
    }

    // Insert task - only use fields that exist in schema
    const insertPayload: any = {
      title: title.trim(),
      assigned_to: assignedToArray,
      due_date: due_date || null,
      note: note?.trim() || null,
      created_by,
      completed: false,
      recurrence_type: recurrence_type || 'once',
      rotation_enabled: rotation_enabled || false,
      rotation_exclude_ids: rotation_exclude_ids || [],
      rotation_index: rotation_index || 0,
    }

    const result: any = await (supabase as any)
      .from('tasks')
      .insert(insertPayload)
      .select()
      .single()

    const task = result.data
    const taskError = result.error

    if (taskError || !task) {
      console.error('❌ Task insert error:', taskError)
      return res.status(500).json({
        error: taskError?.message || 'Failed to create task',
      })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: created_by,
      action_type: 'task_created',
      entity_type: 'task',
      entity_id: task.id,
      metadata: {
        title: task.title,
        assignee_count: assignedToArray.length,
      },
    } as any)

    return res.status(201).json(task as Task)
  } catch (err) {
    console.error('❌ API error in /api/tasks/create:', err)
    return res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error',
    })
  }
}
