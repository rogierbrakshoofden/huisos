import { HeaderV4 } from '@/components/v4/header-v4'
import { BottomNavV4 } from '@/components/v4/bottom-nav-v4'
import { SyncIndicatorV4 } from '@/components/v4/sync-indicator-v4'
import { TaskModal } from '@/components/task-modal'
import { EventModal } from '@/components/event-modal'
import { RewardStoreModal } from '@/components/reward-store-modal'
import { MyRewardsTab } from '@/components/my-rewards-tab'
import { StatsTab } from '@/components/stats-tab'
import { WorkTabV4 } from '@/components/v4/tabs/WorkTabV4'
import { EventsTab } from '@/components/tabs/EventsTab'
import { ActivityLogTab } from '@/components/tabs/ActivityLogTab'
import { ToastContainer } from '@/lib/toast'
import { Task, Event, AppState } from '@/types/huisos-v2'

interface DashboardViewV4Props {
  // State
  state: AppState
  tasks: Task[]
  events: Event[]
  presence: Record<string, { is_home: boolean; note?: string }>
  currentUserId: string
  pendingClaimsCount: number
  isLoading: boolean
  isOnline: boolean
  syncError?: string
  lastSyncedAt?: Date
  isSyncing?: boolean

  // Modal state
  modalState: {
    isTaskModalOpen: boolean
    editingTask: Task | null
    handleOpenNewTask: () => void
    handleEditTask: (task: Task) => void
    handleCloseTaskModal: () => void
    isEventModalOpen: boolean
    editingEvent: Event | null
    handleOpenNewEvent: () => void
    handleEditEvent: (event: Event) => void
    handleCloseEventModal: () => void
    isRewardStoreOpen: boolean
    setIsRewardStoreOpen: (open: boolean) => void
    apiError: string | null
    setApiError: (error: string | null) => void
  }

  // Navigation handlers
  setActiveTab: (tab: 'work' | 'events' | 'stats' | 'log' | 'rewards') => void
  switchUser: (userId: string | 'everybody') => void

  // Task handlers
  onCompleteTask: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onToggleSubtask: (subtaskId: string) => Promise<void>
  onSaveTask: (taskData: Partial<Task>) => Promise<void>

  // Event handlers
  onSaveEvent: (eventData: Partial<Event>) => Promise<void>
  onDeleteEvent: (eventId: string) => Promise<void>

  // Reward handlers
  onRedeemReward: (rewardId: string) => Promise<void>
  onApproveRewardClaim: (claimId: string) => Promise<void>
  onClaimReward: (claimId: string) => Promise<void>

  // Utility functions
  getTokenBalance: (memberId: string) => number

  // Toast
  toasts: any[]
  setToasts: (toasts: any[] | ((prev: any[]) => any[])) => void
}

export function DashboardViewV4({
  state,
  tasks,
  events,
  presence,
  currentUserId,
  pendingClaimsCount,
  isLoading,
  isOnline,
  syncError,
  lastSyncedAt,
  isSyncing,
  modalState,
  setActiveTab,
  switchUser,
  onCompleteTask,
  onDeleteTask,
  onToggleSubtask,
  onSaveTask,
  onSaveEvent,
  onDeleteEvent,
  onRedeemReward,
  onApproveRewardClaim,
  onClaimReward,
  getTokenBalance,
  toasts,
  setToasts,
}: DashboardViewV4Props) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading HuisOS v4...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 scroll-smooth">
      {/* Header with centered brand */}
      <HeaderV4
        activeUserId={state.activeUserId}
        familyMembers={state.familyMembers}
        onUserChange={switchUser}
        onAddClick={() => {
          // Simple toggle between task and event for now
          // We'll enhance this with the dropdown in the header
          modalState.handleOpenNewTask()
        }}
      />

      {/* Error notifications */}
      {(syncError || modalState.apiError) && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-red-900/80 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            {modalState.apiError || syncError}
          </div>
        </div>
      )}

      {/* Main content area with proper spacing */}
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-28">
        {state.activeTab === 'work' && (
          <WorkTabV4
            tasks={tasks}
            familyMembers={state.familyMembers}
            tokens={state.tokens}
            subtasksMap={state.subtasks}
            currentUserId={currentUserId}
            onComplete={onCompleteTask}
            onEdit={modalState.handleEditTask}
            onDelete={onDeleteTask}
            onToggleSubtask={onToggleSubtask}
            onOpenNewTask={modalState.handleOpenNewTask}
            onOpenRewardStore={() => modalState.setIsRewardStoreOpen(true)}
          />
        )}

        {state.activeTab === 'events' && (
          <EventsTab
            events={events}
            onEdit={modalState.handleEditEvent}
            onOpenNewEvent={modalState.handleOpenNewEvent}
          />
        )}

        {state.activeTab === 'stats' && (
          <StatsTab
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            presence={presence}
          />
        )}

        {state.activeTab === 'rewards' && (
          <MyRewardsTab
            rewardClaims={state.rewardClaims}
            rewards={state.rewards}
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            isParent={['rogier', 'anne'].includes(state.activeUserId as string)}
            onApprove={onApproveRewardClaim}
            onClaim={onClaimReward}
          />
        )}

        {state.activeTab === 'log' && (
          <ActivityLogTab
            activityLog={state.activityLog}
            tasks={tasks}
            events={events}
            subtasksMap={state.subtasks}
            onTaskEdit={modalState.handleEditTask}
            onEventEdit={modalState.handleEditEvent}
          />
        )}
      </main>

      {/* Bottom navigation with new design */}
      <BottomNavV4
        activeTab={state.activeTab}
        onTabChange={setActiveTab}
        counts={{
          work: tasks.filter((t) => !t.completed).length,
          events: events.length,
          rewards: pendingClaimsCount,
          log: state.activityLog.length,
        }}
      />

      {/* Sync indicator at bottom */}
      <SyncIndicatorV4
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
        isSyncing={isSyncing}
      />

      {/* Modals */}
      <TaskModal
        task={modalState.editingTask}
        familyMembers={state.familyMembers}
        isOpen={modalState.isTaskModalOpen}
        onClose={modalState.handleCloseTaskModal}
        onSave={onSaveTask}
        onDelete={onDeleteTask}
        currentUserId={currentUserId}
      />

      <EventModal
        event={modalState.editingEvent}
        familyMembers={state.familyMembers}
        isOpen={modalState.isEventModalOpen}
        onClose={modalState.handleCloseEventModal}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
      />

      <RewardStoreModal
        isOpen={modalState.isRewardStoreOpen}
        onClose={() => modalState.setIsRewardStoreOpen(false)}
        rewards={state.rewards}
        familyMembers={state.familyMembers}
        tokens={Object.fromEntries(
          state.familyMembers.map((m) => [m.id, getTokenBalance(m.id)])
        )}
        currentUserId={currentUserId}
        onRedeem={onRedeemReward}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  )
}
