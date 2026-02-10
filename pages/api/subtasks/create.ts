import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/subtasks/create')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface CreateSubtaskRequest {
  taskId: string
  title: string
  createdBy: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask | { error: string }>
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

    // Extract household_id from request header
    const householdId = req.headers['x-household-id'] as string
    if (!householdId) {
      return res.status(401).json({ error: 'Unauthorized: missing household ID' })
    }

    const { taskId, title, createdBy }: CreateSubtaskRequest = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const insertPayload: any = {
      task_id: taskId,
      title: title.trim(),
      completed: false,
      household_id: householdId,
    }

    const result: any = await (supabase as any)
      .from('subtasks')
      .insert(insertPayload)
      .select()
      .single()

    const subtask = result.data
    const subtaskError = result.error

    if (subtaskError || !subtask) {
      console.error('❌ Subtask insert error:', subtaskError)
      return res.status(500).json({
        error: subtaskError?.message || 'Failed to create subtask',
      })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: createdBy,
      action_type: 'subtask_created',
      entity_type: 'subtask',
      entity_id: subtask.id,
      household_id: householdId,
      metadata: {
        title: subtask.title,
        task_id: taskId,
      },
    } as any)

    return res.status(201).json(subtask as Subtask)
  } catch (err) {
    console.error('❌ API error in /api/subtasks/create:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
