import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface ReorderSubtaskRequest {
  updates: Array<{ subtask_id: string; new_order_index: number }>
  reordered_by?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask[] | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { updates, reordered_by }: ReorderSubtaskRequest = req.body

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates array is required' })
    }

    // Validate that order indices are sequential
    const indices = updates.map(u => u.new_order_index).sort((a, b) => a - b)
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] !== i) {
        return res.status(400).json({ error: 'Order indices must be sequential (0, 1, 2, ...)' })
      }
    }

    // Update each subtask's order_index
    const updatePromises = updates.map(({ subtask_id, new_order_index }) =>
      (supabase as any)
        .from('subtasks')
        .update({ order_index: new_order_index })
        .eq('id', subtask_id)
        .select()
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const hasError = results.some((r: any) => r.error)
    if (hasError) {
      console.error('Reorder error:', results.find((r: any) => r.error)?.error)
      return res.status(500).json({ error: 'Failed to reorder subtasks' })
    }

    // Flatten results to get all updated subtasks
    const allSubtasks: Subtask[] = results.flatMap((r: any) => r.data || [])

    // Log activity
    if (allSubtasks.length > 0) {
      await (supabase as any).from('activity_log').insert({
        actor_id: reordered_by || 'system',
        action_type: 'subtask_edited',
        entity_type: 'subtask',
        entity_id: allSubtasks[0].parent_task_id,
        metadata: {
          action: 'reorder',
          count: allSubtasks.length,
        },
      } as any)
    }

    return res.status(200).json(allSubtasks)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
