// pages/v2.tsx
'use client'
import { useState, useEffect } from 'react'
import { useApp, selectTasksForUser, selectEventsForUser } from '@/lib/context-v2'
import { useRealtimeSync } from '@/lib/hooks-v2-enhanced'
import { UserSwitcher } from '@/components/user-switcher'
import { BottomNav } from '@/components/bottom-nav'
import { TaskListItem } from '@/components/task-list-item'
import { Task } from '@/types/huisos-v2'
import { supabase } from '@/lib/supabase'
import confetti from 'canvas-confetti'

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

  const handleCompleteTask = async (taskId: string) => {
    try {
      const activeUserId =
        state.activeUserId === 'everybody'
          ? state.familyMembers[0]?.id
          : (state.activeUserId as string)

      if (!activeUserId) throw new Error('No active user')

      // Update task
      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: activeUserId,
          completed_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'UPDATE_TASK', payload: task as any })

      // Award tokens
      if ((task as any).token_value > 0) {
        await supabase.from('tokens').insert({
          member_id: activeUserId,
          amount: (task as any).token_value,
          reason: `Completed: ${(task as any).title}`,
          task_completion_id: taskId,
        })
      }

      // Log activity
      await supabase.from('activity_log').insert({
        actor_id: activeUserId,
        action_type: 'task_completed',
        entity_type: 'task',
        entity_id: taskId,
        metadata: { title: (task as any).title, token_value: (task as any).token_value },
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch (err) {
      console.error('Failed to complete task:', err)
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to complete task: ${(err as Error).message}`,
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      dispatch({ type: 'DELETE_TASK', payload: taskId })
    } catch (err) {
      console.error('Failed to delete task:', err)
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to delete task: ${(err as Error).message}`,
      })
    }
  }

  const handleEditTask = (task: Task) => {
    console.log('Edit task:', task)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading HuisOS v2...</p>
        </div>
      </div>
    )
  }

  const getTaskAssignees = (task: Task) => {
    return state.familyMembers.filter((m) => task.assignee_ids.includes(m.id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      <UserSwitcher
        activeUserId={state.activeUserId}
        familyMembers={state.familyMembers}
        onUserChange={switchUser}
      />

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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">HuisOS</h1>
          <p className="text-slate-400">Family coordination made simple</p>
        </div>

        {activeTab === 'work' && (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No tasks</p>
                <button className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                  + Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    assignees={getTaskAssignees(task)}
                    onComplete={handleCompleteTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    currentUserId={
                      state.activeUserId === 'everybody'
                        ? undefined
                        : (state.activeUserId as string)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No events</p>
                <button className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                  + Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/80 transition-all duration-200"
                  >
                    <div className="font-medium text-white mb-1">{event.title}</div>
                    <div className="text-sm text-slate-400">
                      {event.all_day
                        ? new Date(event.datetime || '').toLocaleDateString()
                        : new Date(event.datetime || '').toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <div className="space-y-4">
            {state.activityLog.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {state.activityLog.slice(0, 50).map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                        {entry.actor?.initials || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">
                          <span className="font-medium">{entry.actor?.name || 'Unknown'}</span>
                          {' '}
                          <span className="text-slate-400">
                            {entry.action_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workCount={tasks.length}
        eventsCount={events.length}
        logCount={state.activityLog.length}
      />

      <div className="fixed bottom-32 left-4 text-xs text-slate-600 pointer-events-none">
        <p>Phase 2: Live ✓</p>
        <p>Realtime sync: {isOnline ? '🟢' : '🔴'}</p>
      </div>
    </div>
  )
}
