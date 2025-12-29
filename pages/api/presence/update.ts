import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface UpdatePresenceRequest {
  memberId: string
  isHome: boolean
  note?: string
}

interface PresenceResponse {
  id: string
  member_id: string
  is_home: boolean
  note?: string
  last_seen_at: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PresenceResponse | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { memberId, isHome, note }: UpdatePresenceRequest = req.body

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' })
    }

    if (isHome === undefined) {
      return res.status(400).json({ error: 'isHome is required' })
    }

    const lastSeenAt = new Date().toISOString()

    // Upsert presence record (update if exists, insert if not)
    const { data, error } = await supabase
      .from('presence')
      .upsert(
        {
          member_id: memberId,
          is_home: isHome,
          note: note || null,
          last_seen_at: lastSeenAt,
        } as any,
        { onConflict: 'member_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Presence update error:', error)
      return res.status(500).json({ error: 'Failed to update presence' })
    }

    // Log activity only if manual override (not heartbeat)
    if (note) {
      await supabase.from('activity_log').insert({
        actor_id: memberId,
        action_type: 'presence_updated',
        entity_type: 'presence',
        entity_id: memberId,
        metadata: {
          is_home: isHome,
          note: note,
        },
      } as any)
    }

    return res.status(200).json(data as PresenceResponse)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
