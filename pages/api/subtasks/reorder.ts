import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/subtasks/reorder')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface ReorderSubtasksRequest {
  subtaskIds: string[]
  actorId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
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

    const { subtaskIds, actorId }: ReorderSubtasksRequest = req.body

    if (!Array.isArray(subtaskIds) || subtaskIds.length === 0) {
      return res.status(400).json({ error: 'subtaskIds array is required' })
    }

    // Update order field for each subtask
    for (let i = 0; i < subtaskIds.length; i++) {
      const { error } = await supabase
        .from('subtasks')
        .update({ order: i })
        .eq('id', subtaskIds[i])
        .eq('household_id', householdId)

      if (error) {
        console.error('❌ Subtask reorder error:', error)
        return res.status(500).json({
          error: error.message || 'Failed to reorder subtasks',
        })
      }
    }

    // Log activity
    if (actorId) {
      await (supabase as any).from('activity_log').insert({
        actor_id: actorId,
        action_type: 'subtasks_reordered',
        entity_type: 'subtask',
        household_id: householdId,
        metadata: {
          count: subtaskIds.length,
        },
      } as any)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ API error in /api/subtasks/reorder:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
