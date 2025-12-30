// pages/v3.tsx
'use client'
import { useState, useEffect } from 'react'
import { DashboardContainer } from '@/components/DashboardContainer'

export default function V3Dashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-300">Loading...</p>
      </div>
    )
  }

  return <DashboardContainer />
}
