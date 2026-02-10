import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Event } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/events/create')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

interface CreateEventRequest {
  title: string
  datetime?: string | null
  all_day?: boolean
  member_ids: string[]
  recurring?: string | null
  recurring_end?: string | null
  notes?: string | null
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

    const {
      title,
      datetime,
      all_day,
      member_ids,
      recurring,
      recurring_end,
      notes,
      created_by,
    }: CreateEventRequest = req.body

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' })
    }

    const insertPayload: any = {
      title: title.trim(),
      datetime: datetime || null,
      all_day: all_day || false,
      member_ids,
      recurring: recurring || null,
      recurring_end: recurring_end || null,
      notes: notes?.trim() || null,
      household_id: householdId,
    }

    const result: any = await (supabase as any)
      .from('events')
      .insert(insertPayload)
      .select()
      .single()

    const event = result.data
    const eventError = result.error

    if (eventError || !event) {
      console.error('❌ Event insert error:', eventError)
      return res.status(500).json({
        error: eventError?.message || 'Failed to create event',
      })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: created_by,
      action_type: 'event_created',
      entity_type: 'event',
      entity_id: event.id,
      household_id: householdId,
      metadata: {
        title: event.title,
        member_count: member_ids.length,
      },
    } as any)

    return res.status(201).json(event as Event)
  } catch (err) {
    console.error('❌ API error in /api/events/create:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
