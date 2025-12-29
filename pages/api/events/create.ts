import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Event } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface CreateEventRequest {
  title: string
  datetime?: string
  all_day: boolean
  member_ids: string[]
  recurring?: string | null
  notes?: string
  created_by: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Event | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      title,
      datetime,
      all_day,
      member_ids,
      recurring,
      notes,
      created_by,
    }: CreateEventRequest = req.body

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!datetime && !all_day) {
      return res.status(400).json({ error: 'Datetime is required for non-all-day events' })
    }
    if (!member_ids || member_ids.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' })
    }

    // Insert event - cast payload to any
    const insertPayload: any = {
      title: title.trim(),
      datetime: datetime || null,
      all_day,
      member_ids,
      recurring: recurring || null,
      notes: notes?.trim() || null,
    }

    const result: any = await (supabase as any)
      .from('events')
      .insert(insertPayload)
      .select()
      .single()

    const eventData = result.data
    const eventError = result.error

    if (eventError || !eventData) {
      console.error('Event insert error:', eventError)
      return res.status(500).json({ error: 'Failed to create event' })
    }

    const event = eventData as Event

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: created_by,
      action_type: 'event_created',
      entity_type: 'event',
      entity_id: event.id,
      metadata: {
        title: event.title,
        datetime: event.datetime,
      },
    } as any)

    return res.status(201).json(event)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
