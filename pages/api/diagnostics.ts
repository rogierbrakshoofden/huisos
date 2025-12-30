import type { NextApiRequest, NextApiResponse } from 'next'

interface DiagnosticsResponse {
  version: string
  timestamp: string
  environment: {
    supabaseUrl: boolean
    supabaseServiceKey: boolean
    vercelUrl: boolean
    nodeEnv: string
  }
  status: 'healthy' | 'degraded'
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticsResponse>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vercelUrl = process.env.VERCEL_URL
  const nodeEnv = process.env.NODE_ENV

  const status =
    supabaseUrl && supabaseServiceKey ? 'healthy' : 'degraded'

  res.status(200).json({
    version: '0.1.4',
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      vercelUrl: !!vercelUrl,
      nodeEnv: nodeEnv || 'unknown',
    },
    status,
  })
}
