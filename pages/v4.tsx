import { useState, useEffect } from 'react'
import { DashboardContainerV4 } from '../components/v4/DashboardContainerV4'

export default function V4Dashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
      </div>
    )
  }

  return <DashboardContainerV4 />
}
