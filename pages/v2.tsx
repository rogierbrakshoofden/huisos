import { useState, useEffect } from 'react'
import { useApp, selectTasksForUser, selectEventsForUser } from '@/lib/context-v2'
import { useRealtimeSync } from '@/lib/hooks-v2'

export default function V2Dashboard() {
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

  return <V2DashboardContent />
}

function V2DashboardContent() {
  const { state, dispatch } = useApp()
  const { isLoading, isOnline, syncError } = useRealtimeSync()
  const tasks = selectTasksForUser(state)
  const events = selectEventsForUser(state)
  const activeTab = state.activeTab

  const setActiveTab = (tab: 'work' | 'events' | 'log') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }

  const switchUser = (userId: string | 'everybody') => {
    dispatch({ type: 'SET_ACTIVE_USER', payload: userId })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">HuisOS v2 (Phase 1)</h1>
          <div className="flex gap-4">
            <select
              value={state.activeUserId}
              onChange={e => switchUser(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
            >
              <option value="everybody">👥 Everybody</option>
              {state.familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.initials} {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {syncError && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-red-900/80 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            {syncError}
          </div>
        </div>
      )}
      {!isOnline && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-yellow-900/80 border border-yellow-700 text-yellow-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            Offline • Using cached data
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Active Tab: {activeTab.toUpperCase()}</h2>
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('work')}
              className={`px-4 py-2 rounded ${
                activeTab === 'work'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Work ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded ${
                activeTab === 'events'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 rounded ${
                activeTab === 'log'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Log ({state.activityLog.length})
            </button>
          </div>
        </div>

        {activeTab === 'work' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Work Tab</h3>
            {tasks.length === 0 ? (
              <p className="text-slate-400">No tasks</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="bg-slate-800 p-4 rounded border border-slate-700">
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-slate-400 text-sm">{task.recurrence_type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Events Tab</h3>
            {events.length === 0 ? (
              <p className="text-slate-400">No events</p>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <div key={event.id} className="bg-slate-800 p-4 rounded border border-slate-700">
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-slate-400 text-sm">{event.all_day ? 'All day' : event.datetime}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Activity Log</h3>
            {state.activityLog.length === 0 ? (
              <p className="text-slate-400">No activity</p>
            ) : (
              <div className="space-y-2">
                {state.activityLog.slice(0, 10).map(entry => (
                  <div key={entry.id} className="bg-slate-800 p-4 rounded border border-slate-700">
                    <p className="text-white font-medium">{entry.actor?.name} {entry.action_type}</p>
                    <p className="text-slate-400 text-sm">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-4 left-4 text-xs text-slate-500">
        <p>Phase 1: Navigation &amp; State Management Ready</p>
        <p>Next: Phase 2 - Task Completion &amp; Modals</p>
      </div>
    </div>
  )
}
