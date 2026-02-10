import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/events/delete')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  if (req.method !== 'DELETE') {
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

    const { eventId, actorId } = req.body

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' })
    }

    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('household_id', householdId)

    if (eventError) {
      console.error('❌ Event delete error:', eventError)
      return res.status(500).json({
        error: eventError.message || 'Failed to delete event',
      })
    }

    // Log activity
    if (actorId) {
      await (supabase as any).from('activity_log').insert({
        actor_id: actorId,
        action_type: 'event_deleted',
        entity_type: 'event',
        entity_id: eventId,
        household_id: householdId,
        metadata: {},
      } as any)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ API error in /api/events/delete:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
