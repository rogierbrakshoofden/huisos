// pages/v2.tsx
'use client'
import { useState, useEffect } from 'react'
import { useApp, selectTasksForUser, selectEventsForUser } from '@/lib/context-v2'
import { useRealtimeSync } from '@/lib/hooks-v2-enhanced'
import { useToast, ToastContainer } from '@/lib/toast'
import { UserSwitcher } from '@/components/user-switcher'
import { BottomNav } from '@/components/bottom-nav'
import { AddButton } from '@/components/add-button'
import { TaskListItem } from '@/components/task-list-item'
import { TaskModal } from '@/components/task-modal'
import { EventModal } from '@/components/event-modal'
import { TokenWidget } from '@/components/token-widget'
import { RewardStoreModal } from '@/components/reward-store-modal'
import { MyRewardsTab } from '@/components/my-rewards-tab'
import { StatsTab } from '@/components/stats-tab'
import { Task, Event } from '@/types/huisos-v2'
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
  const { toasts, toast, setToasts } = useToast()
  const tasks = selectTasksForUser(state)
  const events = selectEventsForUser(state)
  const activeTab = state.activeTab
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isRewardStoreOpen, setIsRewardStoreOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [presence, setPresence] = useState<Record<string, { is_home: boolean; note?: string }>>({})

  // Presence tracking: update on mount & every 30s
  useEffect(() => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    if (!activeUserId) return

    const updatePresence = async () => {
      try {
        await fetch('/api/presence/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: activeUserId,
            isHome: true,
          }),
        })
      } catch (err) {
        console.warn('Presence update failed:', err)
      }
    }

    // Update immediately on mount
    updatePresence()

    // Then every 30 seconds (heartbeat)
    const interval = setInterval(updatePresence, 30000)

    // On page unload, set to away
    const handleUnload = () => {
      fetch('/api/presence/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: activeUserId,
          isHome: false,
        }),
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [state.activeUserId, state.familyMembers])

  const setActiveTab = (tab: 'work' | 'events' | 'stats' | 'log' | 'rewards') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }

  const switchUser = (userId: string | 'everybody') => {
    dispatch({ type: 'SET_ACTIVE_USER', payload: userId })
  }

  const handleOpenNewTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleOpenNewEvent = () => {
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsEventModalOpen(true)
  }

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
    setApiError(null)
  }

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
    setEditingEvent(null)
    setApiError(null)
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    if (!activeUserId) throw new Error('No active user')

    try {
      setApiError(null)

      if (editingTask) {
        // Update existing task
        const response = await fetch('/api/tasks/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: editingTask.id,
            ...taskData,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update task')
        }

        const updatedTask = await response.json()
        dispatch({
          type: 'UPDATE_TASK',
          payload: updatedTask as Task,
        })
        toast('Task updated ✓', 'success')
      } else {
        // Create new task
        const response = await fetch('/api/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            created_by: activeUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create task')
        }

        const newTask = await response.json()
        dispatch({
          type: 'ADD_TASK',
          payload: newTask as Task,
        })
        toast('Task created ✓', 'success')
      }
    } catch (err) {
      const message = (err as Error).message
      setApiError(message)
      toast(message, 'error')
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to save task: ${message}`,
      })
      throw err
    }
  }

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    if (!activeUserId) throw new Error('No active user')

    try {
      setApiError(null)

      if (editingEvent) {
        // Update existing event
        const response = await fetch('/api/events/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: editingEvent.id,
            ...eventData,
            actorId: activeUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update event')
        }

        const updatedEvent = await response.json()
        dispatch({
          type: 'UPDATE_EVENT',
          payload: updatedEvent as Event,
        })
        toast('Event updated ✓', 'success')
      } else {
        // Create new event
        const response = await fetch('/api/events/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...eventData,
            created_by: activeUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create event')
        }

        const newEvent = await response.json()
        dispatch({
          type: 'ADD_EVENT',
          payload: newEvent as Event,
        })
        toast('Event created ✓', 'success')
      }
    } catch (err) {
      const message = (err as Error).message
      setApiError(message)
      toast(message, 'error')
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to save event: ${message}`,
      })
      throw err
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    try {
      setApiError(null)

      const response = await fetch('/api/tasks/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          actorId: activeUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      dispatch({ type: 'DELETE_TASK', payload: taskId })
      toast('Task deleted', 'success')
    } catch (err) {
      const message = (err as Error).message
      setApiError(message)
      toast(message, 'error')
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to delete task: ${message}`,
      })
      throw err
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    try {
      setApiError(null)

      const response = await fetch('/api/events/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          actorId: activeUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete event')
      }

      dispatch({ type: 'DELETE_EVENT', payload: eventId })
      toast('Event deleted', 'success')
    } catch (err) {
      const message = (err as Error).message
      setApiError(message)
      toast(message, 'error')
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to delete event: ${message}`,
      })
      throw err
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      setApiError(null)

      const activeUserId =
        state.activeUserId === 'everybody'
          ? state.familyMembers[0]?.id
          : (state.activeUserId as string)

      if (!activeUserId) throw new Error('No active user')

      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completedBy: activeUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete task')
      }

      const completedTask = await response.json()
      dispatch({
        type: 'UPDATE_TASK',
        payload: completedTask as Task,
      })

      toast('✨ Chore completed! Tokens earned! Next rotation: ', 'success')

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch (err) {
      console.error('Failed to complete task:', err)
      const message = (err as Error).message
      setApiError(message)
      toast(message, 'error')
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed: ${message}`,
      })
    }
  }

  // Phase 5: Rewards
  const handleRedeemReward = async (rewardId: string) => {
    const activeUserId =
      state.activeUserId === 'everybody'
        ? state.familyMembers[0]?.id
        : (state.activeUserId as string)

    if (!activeUserId) throw new Error('No active user')

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          memberId: activeUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to redeem reward')
      }

      const claim = await response.json()
      dispatch({
        type: 'ADD_REWARD_CLAIM',
        payload: claim.claim,
      })

      setIsRewardStoreOpen(false)
      toast('🎁 Reward redeemed! Parents will review soon.', 'success')

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3 },
      })
    } catch (err) {
      const message = (err as Error).message
      toast(message, 'error')
      throw err
    }
  }

  const handleApproveRewardClaim = async (claimId: string) => {
    try {
      const response = await fetch('/api/rewards/update-claim', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          status: 'approved',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve reward')
      }

      const claim = state.rewardClaims.find((c) => c.id === claimId)
      if (claim) {
        dispatch({
          type: 'UPDATE_REWARD_CLAIM',
          payload: { ...claim, status: 'approved' },
        })
      }
      toast('Reward approved ✓', 'success')
    } catch (err) {
      const message = (err as Error).message
      toast(message, 'error')
      throw err
    }
  }

  const handleClaimReward = async (claimId: string) => {
    try {
      const response = await fetch('/api/rewards/update-claim', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          status: 'claimed',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to claim reward')
      }

      const claim = state.rewardClaims.find((c) => c.id === claimId)
      if (claim) {
        dispatch({
          type: 'UPDATE_REWARD_CLAIM',
          payload: {
            ...claim,
            status: 'claimed',
            claimed_at: new Date().toISOString(),
          },
        })
      }
      toast('Reward claimed! Enjoy! 🎉', 'success')
    } catch (err) {
      const message = (err as Error).message
      toast(message, 'error')
      throw err
    }
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

  const getTokenBalance = (memberId: string) => {
    return state.tokens
      .filter((t) => t.member_id === memberId)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const pendingClaimsCount = state.rewardClaims.filter(
    (c) => c.status === 'pending'
  ).length

  const currentUserId =
    state.activeUserId === 'everybody'
      ? state.familyMembers[0]?.id || ''
      : (state.activeUserId as string)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      <UserSwitcher
        activeUserId={state.activeUserId}
        familyMembers={state.familyMembers}
        onUserChange={switchUser}
      />

      <AddButton
        onTaskClick={handleOpenNewTask}
        onEventClick={handleOpenNewEvent}
      />

      {(syncError || apiError) && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-red-900/80 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            {apiError || syncError}
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
            <TokenWidget
              familyMembers={state.familyMembers}
              tokens={state.tokens}
            />
            <button
              onClick={() => setIsRewardStoreOpen(true)}
              className="w-full px-4 py-3 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-300 hover:bg-amber-600/30 transition-colors mb-4 text-sm font-medium"
            >
              🎁 Visit Reward Store
            </button>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No tasks</p>
                <button
                  onClick={handleOpenNewTask}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
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
                    currentUserId={currentUserId}
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
                <button
                  onClick={handleOpenNewEvent}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >
                  + Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="font-medium text-white mb-1">
                      {event.title}
                    </div>
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

        {activeTab === 'stats' && (
          <StatsTab
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            presence={presence}
          />
        )}

        {activeTab === 'rewards' && (
          <MyRewardsTab
            rewardClaims={state.rewardClaims}
            rewards={state.rewards}
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            isParent={['rogier', 'anne'].includes(state.activeUserId as string)}
            onApprove={handleApproveRewardClaim}
            onClaim={handleClaimReward}
          />
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
                          <span className="font-medium">
                            {entry.actor?.name || 'Unknown'}
                          </span>
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
        rewardsCount={pendingClaimsCount}
      />

      <TaskModal
        task={editingTask}
        familyMembers={state.familyMembers}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        currentUserId={currentUserId}
      />

      <EventModal
        event={editingEvent}
        familyMembers={state.familyMembers}
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <RewardStoreModal
        isOpen={isRewardStoreOpen}
        onClose={() => setIsRewardStoreOpen(false)}
        rewards={state.rewards}
        familyMembers={state.familyMembers}
        tokens={Object.fromEntries(
          state.familyMembers.map((m) => [m.id, getTokenBalance(m.id)])
        )}
        currentUserId={currentUserId}
        onRedeem={handleRedeemReward}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <div className="fixed bottom-32 left-4 text-xs text-slate-600 pointer-events-none">
        <p>Phase 6: Automation & Analytics 🚀</p>
        <p>Realtime sync: {isOnline ? '🟢' : '🔴'}</p>
      </div>
    </div>
  )
}
