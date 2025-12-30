// types/huisos-v2.ts
// HuisOS v2 TypeScript Types

export interface FamilyMember {
  id: string
  name: string
  initials: string
  color: string
  email?: string
  push_subscription?: Record<string, unknown>
  created_at: string
}

export type RecurrenceType = 'once' | 'repeating'
export type Frequency = 'daily' | 'every_two_days' | 'weekly' | 'monthly' | 'yearly'

export interface Task {
  id: string
  title: string
  assigned_to?: string
  completed: boolean
  completed_at?: string
  due_date?: string
  note?: string
  created_by?: string
  created_at: string
  updated_at?: string
  subtasks?: Subtask[]
}

export interface Subtask {
  id: string
  parent_task_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: string
  completed_by?: string
  order_index: number
  created_at: string
  updated_at: string
}

export type EventRecurrence = 'daily' | 'weekly' | 'monthly' | 'yearly' | null

export interface Event {
  id: string
  title: string
  datetime?: string
  all_day: boolean
  end_time?: string
  member_ids: string[]
  recurring?: EventRecurrence
  recurrence_end_date?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export type ActionType =
  | 'task_created'
  | 'task_completed'
  | 'task_edited'
  | 'task_deleted'
  | 'subtask_created'
  | 'subtask_completed'
  | 'subtask_edited'
  | 'subtask_deleted'
  | 'event_created'
  | 'event_edited'
  | 'event_deleted'
  | 'task_delegated'
  | 'delegation_accepted'
  | 'delegation_declined'

export type EntityType = 'task' | 'subtask' | 'event'

export interface ActivityLogEntry {
  id: string
  actor_id: string
  action_type: ActionType
  entity_type: EntityType
  entity_id: string
  metadata: Record<string, unknown>
  created_at: string
  actor?: FamilyMember
}

export interface Token {
  id: string
  member_id: string
  amount: number
  reason: string
  task_completion_id?: string
  created_at: string
}

export interface Reward {
  id: string
  title: string
  description?: string
  icon_emoji: string
  token_cost: number
  active: boolean
  created_at: string
}

export interface RewardClaim {
  id: string
  member_id: string
  reward_id: string
  status: 'pending' | 'approved' | 'claimed'
  claimed_at?: string
  redeemed_at: string
  created_at: string
  reward?: Reward
}

export interface Presence {
  id: string
  member_id: string
  date: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  note?: string
  created_at?: string
}

export type TabType = 'work' | 'events' | 'stats' | 'log' | 'rewards'

export interface AppState {
  activeUserId: string | 'everybody'
  familyMembers: FamilyMember[]
  tasks: Task[]
  subtasks: Map<string, Subtask[]>
  events: Event[]
  activityLog: ActivityLogEntry[]
  tokens: Token[]
  rewards: Reward[]
  rewardClaims: RewardClaim[]
  presence: Presence[]
  activeTab: TabType
  modalOpen: 'task' | 'event' | null
  selectedTaskForEdit: Task | null
  editingTaskId?: string
  isOnline: boolean
  lastSyncedAt: Date | null
  syncError?: string
  isLoading: boolean
}
