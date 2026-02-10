import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/subtasks/complete')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface CompleteSubtaskRequest {
  subtaskId: string
  completed: boolean
  completedBy: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask | { error: string }>
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

    // Extract household_id from request header
    const householdId = req.headers['x-household-id'] as string
    if (!householdId) {
      return res.status(401).json({ error: 'Unauthorized: missing household ID' })
    }

    const { subtaskId, completed, completedBy }: CompleteSubtaskRequest = req.body

    if (!subtaskId) {
      return res.status(400).json({ error: 'subtaskId is required' })
    }

    const result: any = await (supabase as any)
      .from('subtasks')
      .update({ completed })
      .eq('id', subtaskId)
      .eq('household_id', householdId)
      .select()
      .single()

    const subtask = result.data
    const subtaskError = result.error

    if (subtaskError || !subtask) {
      console.error('❌ Subtask update error:', subtaskError)
      return res.status(500).json({
        error: subtaskError?.message || 'Failed to update subtask',
      })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: completedBy,
      action_type: completed ? 'subtask_completed' : 'subtask_reopened',
      entity_type: 'subtask',
      entity_id: subtask.id,
      household_id: householdId,
      metadata: {
        title: subtask.title,
      },
    } as any)

    return res.status(200).json(subtask as Subtask)
  } catch (err) {
    console.error('❌ API error in /api/subtasks/complete:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
