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

    // Update event - only pass fields that are defined
    const updatePayload: any = {}
    if (title !== undefined) updatePayload.title = title?.trim() || ''
    if (datetime !== undefined) updatePayload.datetime = datetime || null
    if (all_day !== undefined) updatePayload.all_day = all_day
    if (member_ids !== undefined) updatePayload.member_ids = member_ids
    if (recurring !== undefined) updatePayload.recurring = recurring
    if (notes !== undefined) updatePayload.notes = notes?.trim() || null
    updatePayload.updated_at = new Date().toISOString()

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single()

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
