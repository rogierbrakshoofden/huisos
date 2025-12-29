import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface ListSubtasksRequest {
  parent_task_id: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Subtask[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { parent_task_id } = req.query

    if (!parent_task_id || typeof parent_task_id !== 'string') {
      return res.status(400).json({ error: 'parent_task_id is required' })
    }

    // Fetch subtasks sorted by order_index
    const result: any = await (supabase as any)
      .from('subtasks')
      .select('*')
      .eq('parent_task_id', parent_task_id)
      .order('order_index', { ascending: true })

    const subtasks = result.data
    const queryError = result.error

    if (queryError) {
      console.error('Subtask fetch error:', queryError)
      return res.status(500).json({ error: 'Failed to fetch subtasks' })
    }

    return res.status(200).json((subtasks || []) as Subtask[])
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
