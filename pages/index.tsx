import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to v4 (current production version with PWA, glass design, bottom bar)
    router.replace('/v4')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
    </div>
  )
}
