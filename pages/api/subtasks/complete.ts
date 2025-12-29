import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface CompleteSubtaskRequest {
  subtask_id: string
  completed_by: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subtask_id, completed_by }: CompleteSubtaskRequest = req.body

    if (!subtask_id) {
      return res.status(400).json({ error: 'subtask_id is required' })
    }
    if (!completed_by) {
      return res.status(400).json({ error: 'completed_by is required' })
    }

    // Mark subtask as completed
    const result: any = await (supabase as any)
      .from('subtasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: completed_by,
      })
      .eq('id', subtask_id)
      .select()
      .single()

    const subtask = result.data
    const updateError = result.error

    if (updateError || !subtask) {
      console.error('Subtask completion error:', updateError)
      return res.status(500).json({ error: 'Failed to complete subtask' })
    }

    // Log activity - no tokens awarded for subtasks
    await (supabase as any).from('activity_log').insert({
      actor_id: completed_by,
      action_type: 'subtask_completed',
      entity_type: 'subtask',
      entity_id: subtask.id,
      metadata: {
        parent_task_id: subtask.parent_task_id,
        title: subtask.title,
      },
    } as any)

    return res.status(200).json(subtask as Subtask)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
