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
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials. Contact admin.',
      })
    }

    const { title, assigned_to, due_date, note, created_by }: CreateTaskRequest = req.body

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!created_by) {
      return res.status(400).json({ error: 'created_by is required' })
    }

    // Handle assigned_to: can be string or array, convert to single string
    let assignedToValue: string | null = null
    if (assigned_to) {
      if (typeof assigned_to === 'string') {
        assignedToValue = assigned_to
      } else if (Array.isArray(assigned_to) && assigned_to.length > 0) {
        assignedToValue = assigned_to[0]
      }
    }

    // Insert task - only use columns that exist in schema
    const insertPayload: any = {
      title: title.trim(),
      assigned_to: assignedToValue,
      due_date: due_date || null,
      note: note?.trim() || null,
      created_by,
      completed: false,
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
