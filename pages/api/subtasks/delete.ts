import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface DeleteSubtaskRequest {
  subtask_id: string
  deleted_by?: string
}

interface DeleteSubtaskResponse {
  success: boolean
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteSubtaskResponse>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { subtask_id, deleted_by }: DeleteSubtaskRequest = req.body

    if (!subtask_id) {
      return res.status(400).json({ success: false, error: 'subtask_id is required' })
    }

    // Get subtask metadata before deletion
    const getResult: any = await (supabase as any)
      .from('subtasks')
      .select('id, parent_task_id, title')
      .eq('id', subtask_id)
      .single()

    const subtaskData = getResult.data

    if (getResult.error || !subtaskData) {
      return res.status(400).json({ success: false, error: 'Subtask not found' })
    }

    // Delete subtask
    const deleteResult: any = await (supabase as any)
      .from('subtasks')
      .delete()
      .eq('id', subtask_id)

    if (deleteResult.error) {
      console.error('Subtask delete error:', deleteResult.error)
      return res.status(500).json({ success: false, error: 'Failed to delete subtask' })
    }

    // Log activity
    await (supabase as any).from('activity_log').insert({
      actor_id: deleted_by || 'system',
      action_type: 'subtask_deleted',
      entity_type: 'subtask',
      entity_id: subtask_id,
      metadata: {
        parent_task_id: subtaskData.parent_task_id,
        title: subtaskData.title,
      },
    } as any)

    return res.status(200).json({ success: true, message: 'Subtask deleted' })
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
