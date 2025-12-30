import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface UpdateSubtaskRequest {
  subtask_id: string
  title?: string
  description?: string
  order_index?: number
  updated_by?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subtask_id, title, description, order_index, updated_by }: UpdateSubtaskRequest = req.body

    if (!subtask_id) {
      return res.status(400).json({ error: 'subtask_id is required' })
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title?.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' })
      }
      if (title.length > 255) {
        return res.status(400).json({ error: 'Title must be 255 characters or less' })
      }
    }

    // Validate order_index if provided
    if (order_index !== undefined) {
      if (order_index < 0) {
        return res.status(400).json({ error: 'order_index must be >= 0' })
      }
    }

    // Build update payload
    const updatePayload: any = {}
    if (title !== undefined) updatePayload.title = title.trim()
    if (description !== undefined) updatePayload.description = description?.trim() || null
    if (order_index !== undefined) updatePayload.order_index = order_index

    // Update subtask
    const result: any = await (supabase as any)
      .from('subtasks')
      .update(updatePayload)
      .eq('id', subtask_id)
      .select()
      .single()

    const subtask = result.data
    const updateError = result.error

    if (updateError || !subtask) {
      console.error('Subtask update error:', updateError)
      return res.status(500).json({ error: 'Failed to update subtask' })
    }

    // Log activity if meaningful changes
    // BUG FIX #3: Add title to metadata
    if (Object.keys(updatePayload).length > 0) {
      await (supabase as any).from('activity_log').insert({
        actor_id: updated_by || 'system',
        action_type: 'subtask_edited',
        entity_type: 'subtask',
        entity_id: subtask.id,
        metadata: {
          title: subtask.title,
          changes: updatePayload,
        },
      } as any)
    }

    return res.status(200).json(subtask as Subtask)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
