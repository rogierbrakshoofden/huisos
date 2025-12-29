import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface CreateSubtaskRequest {
  parent_task_id: string
  title: string
  description?: string
  created_by?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { parent_task_id, title, description, created_by }: CreateSubtaskRequest = req.body

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (title.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less' })
    }
    if (!parent_task_id) {
      return res.status(400).json({ error: 'parent_task_id is required' })
    }

    // Verify parent task exists
    const taskCheck: any = await (supabase as any)
      .from('tasks')
      .select('id')
      .eq('id', parent_task_id)
      .single()

    if (taskCheck.error || !taskCheck.data) {
      return res.status(400).json({ error: 'Parent task does not exist' })
    }

    // Get max order_index for this task
    const maxOrderResult: any = await (supabase as any)
      .from('subtasks')
      .select('order_index')
      .eq('parent_task_id', parent_task_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrderIndex = maxOrderResult.data?.[0]?.order_index ?? -1
    const newOrderIndex = maxOrderIndex + 1

    // Insert subtask
    const insertPayload: any = {
      parent_task_id,
      title: title.trim(),
      description: description?.trim() || null,
      completed: false,
      order_index: newOrderIndex,
    }

    const result: any = await (supabase as any)
      .from('subtasks')
      .insert(insertPayload)
      .select()
      .single()

    const subtask = result.data
    const subtaskError = result.error

    if (subtaskError || !subtask) {
      console.error('Subtask insert error:', subtaskError)
      return res.status(500).json({ error: 'Failed to create subtask' })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: created_by || 'system',
      action_type: 'subtask_created',
      entity_type: 'subtask',
      entity_id: subtask.id,
      metadata: {
        parent_task_id,
        title: subtask.title,
      },
    } as any)

    return res.status(201).json(subtask as Subtask)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
