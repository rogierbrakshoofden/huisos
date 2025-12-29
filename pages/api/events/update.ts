import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Event } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface UpdateEventRequest {
  eventId: string
  title?: string
  datetime?: string
  all_day?: boolean
  member_ids?: string[]
  recurring?: string | null
  notes?: string
  actorId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Event | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { eventId, actorId, title, datetime, all_day, member_ids, recurring, notes }: UpdateEventRequest = req.body

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' })
    }

    // Build update object
    const updates: any = {}
    if (title !== undefined) updates.title = title?.trim() || ''
    if (datetime !== undefined) updates.datetime = datetime || null
    if (all_day !== undefined) updates.all_day = all_day
    if (member_ids !== undefined) updates.member_ids = member_ids
    if (recurring !== undefined) updates.recurring = recurring
    if (notes !== undefined) updates.notes = notes?.trim() || null
    updates.updated_at = new Date().toISOString()

    // Update event - cast entire result to any
    const result: any = await (supabase as any)
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    const eventData = result.data
    const eventError = result.error

    if (eventError || !eventData) {
      console.error('Event update error:', eventError)
      return res.status(500).json({ error: 'Failed to update event' })
    }

    const event = eventData as Event

    // Log activity
    await supabase.from('activity_log').insert({
      actor_id: actorId || 'system',
      action_type: 'event_edited',
      entity_type: 'event',
      entity_id: event.id,
      metadata: {
        title: event.title,
      },
    } as any)

    return res.status(200).json(event)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
