import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Event } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/events/update')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface UpdateEventRequest {
  eventId: string
  title?: string
  datetime?: string | null
  all_day?: boolean
  member_ids?: string[]
  recurring?: string | null
  recurring_end?: string | null
  notes?: string | null
  [key: string]: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Event | { error: string }>
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

    const { eventId, ...updateData }: UpdateEventRequest = req.body

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' })
    }

    const updates: Record<string, any> = {}

    if (updateData.title !== undefined) {
      updates.title = updateData.title?.trim() || ''
    }
    if (updateData.datetime !== undefined) {
      updates.datetime = updateData.datetime || null
    }
    if (updateData.all_day !== undefined) {
      updates.all_day = updateData.all_day
    }
    if (updateData.member_ids !== undefined) {
      if (!Array.isArray(updateData.member_ids) || updateData.member_ids.length === 0) {
        return res.status(400).json({ error: 'At least one member is required' })
      }
      updates.member_ids = updateData.member_ids
    }
    if (updateData.recurring !== undefined) {
      updates.recurring = updateData.recurring || null
    }
    if (updateData.recurring_end !== undefined) {
      updates.recurring_end = updateData.recurring_end || null
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes?.trim() || null
    }

    const result: any = await (supabase as any)
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('household_id', householdId)
      .select()
      .single()

    const event = result.data
    const eventError = result.error

    if (eventError || !event) {
      console.error('❌ Event update error:', eventError)
      return res.status(500).json({
        error: eventError?.message || 'Failed to update event',
      })
    }

    // Log activity
    const actorId = updateData.updated_by || 'system'
    await (supabase as any).from('activity_log').insert({
      actor_id: actorId,
      action_type: 'event_edited',
      entity_type: 'event',
      entity_id: event.id,
      household_id: householdId,
      metadata: {
        title: event.title,
      },
    } as any)

    return res.status(200).json(event as Event)
  } catch (err) {
    console.error('❌ API error in /api/events/update:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
