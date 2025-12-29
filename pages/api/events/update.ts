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
    const { eventId, ...updateData }: UpdateEventRequest = req.body

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' })
    }

    // Build update object
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
      updates.member_ids = updateData.member_ids
    }
    if (updateData.recurring !== undefined) {
      updates.recurring = updateData.recurring
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes?.trim() || null
    }

    updates.updated_at = new Date().toISOString()

    // Update event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (eventError || !event) {
      console.error('Event update error:', eventError)
      return res.status(500).json({ error: 'Failed to update event' })
    }

    // Log activity
    const actorId = updateData.actorId || 'system'
    await supabase.from('activity_log').insert({
      actor_id: actorId,
      action_type: 'event_edited',
      entity_type: 'event',
      entity_id: event.id,
      metadata: {
        title: event.title,
      },
    })

    return res.status(200).json(event as Event)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
