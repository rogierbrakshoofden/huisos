import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface UpdatePresenceRequest {
  memberId: string
  period: 'morning' | 'afternoon' | 'evening'
  isHome: boolean
  note?: string
}

interface PresenceResponse {
  id: string
  member_id: string
  date: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  note?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PresenceResponse | { error: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { memberId, period, isHome, note }: UpdatePresenceRequest = req.body

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' })
    }

    if (!period) {
      return res.status(400).json({ error: 'period is required' })
    }

    if (isHome === undefined) {
      return res.status(400).json({ error: 'isHome is required' })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get existing presence record for today
    const { data: existing, error: fetchError } = await supabase
      .from('presence')
      .select()
      .eq('member_id', memberId)
      .eq('date', today)
      .maybeSingle() // Use maybeSingle instead of single to handle no rows gracefully

    if (fetchError) {
      console.error('Presence fetch error:', fetchError)
      return res.status(500).json({ error: 'Failed to fetch presence' })
    }

    // Build update object based on period
    const updateData = {
      member_id: memberId,
      date: today,
      [period]: isHome,
      note: note || null,
    } as any

    // Upsert presence record
    const { data, error } = await supabase
      .from('presence')
      .upsert(updateData, { onConflict: 'member_id,date' })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Presence update error:', error)
      return res.status(500).json({ error: 'Failed to update presence' })
    }

    if (!data) {
      return res.status(500).json({ error: 'No data returned from update' })
    }

    return res.status(200).json(data as PresenceResponse)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
