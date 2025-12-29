// lib/supabase-service.ts
import { supabase } from '@/lib/supabase'
import { Task, Event, ActivityLogEntry, FamilyMember, Subtask } from '@/types/huisos-v2'

/**
 * Fetch all family members
 */
export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch tasks for a specific user or all tasks
 */
export async function fetchTasks(userId?: string): Promise<Task[]> {
  let query = supabase.from('tasks').select('*')

  if (userId && userId !== 'everybody') {
    // Filter by user as assignee
    query = query.contains('assignee_ids', `["${userId}"]`)
  }

  const { data, error } = await query
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Fetch events for a specific user or all events
 */
export async function fetchEvents(userId?: string): Promise<Event[]> {
  let query = supabase.from('events').select('*')

  if (userId && userId !== 'everybody') {
    // Filter by user as attendee
    query = query.contains('member_ids', `["${userId}"]`)
  }

  const { data, error } = await query
    .order('datetime', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch activity log with optional pagination
 */
export async function fetchActivityLog(limit = 100, offset = 0): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:family_members(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []) as ActivityLogEntry[]
}

/**
 * Fetch subtasks for a specific task
 */
export async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('parent_task_id', taskId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Create a new task
 */
export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

/**
 * Complete a task and handle rotation + tokens
 */
export async function completeTask(taskId: string, userId: string): Promise<Task> {
  // Mark task as complete
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completed_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', taskId)
    .select()
    .single()

  if (updateError) throw updateError

  // Handle rotation if applicable
  if (task.recurrence_type === 'repeating' && task.rotation_enabled) {
    const nextIndex = getNextRotationIndex(task)
    await updateTask(taskId, { rotation_index: nextIndex })
  }

  // Award tokens if applicable
  if (task.token_value > 0) {
    await supabase.from('tokens').insert({
      member_id: userId,
      amount: task.token_value,
      reason: `Completed: ${task.title}`,
      task_completion_id: taskId,
    })
  }

  // Log activity
  await logActivity({
    actor_id: userId,
    action_type: 'task_completed',
    entity_type: 'task',
    entity_id: taskId,
    metadata: { title: task.title, token_value: task.token_value },
  })

  return task
}

/**
 * Helper: calculate next rotation index
 */
function getNextRotationIndex(task: Task): number {
  const assignees = task.assignee_ids || []
  const excludeIds = task.rotation_exclude_ids || []
  const currentIndex = task.rotation_index || 0

  const eligibleIndices = assignees
    .map((id, idx) => (!excludeIds.includes(id) ? idx : -1))
    .filter(idx => idx >= 0)

  if (eligibleIndices.length === 0) return 0

  const currentPosition = eligibleIndices.indexOf(currentIndex)
  const nextPosition = (currentPosition + 1) % eligibleIndices.length
  return eligibleIndices[nextPosition]
}

/**
 * Create a new event
 */
export async function createEvent(
  event: Omit<Event, 'id' | 'created_at'>,
  userId: string
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

/**
 * Log an activity
 */
export async function logActivity(log: Omit<ActivityLogEntry, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('activity_log')
    .insert(log)

  if (error) throw error
}

/**
 * Create a subtask
 */
export async function createSubtask(
  parentTaskId: string,
  title: string,
  description?: string,
  orderIndex = 0
): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      parent_task_id: parentTaskId,
      title,
      description,
      order_index: orderIndex,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a subtask
 */
export async function updateSubtask(
  subtaskId: string,
  updates: Partial<Subtask>
): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a subtask
 */
export async function deleteSubtask(subtaskId: string): Promise<void> {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId)

  if (error) throw error
}

/**
 * Complete a subtask
 */
export async function completeSubtask(subtaskId: string, userId: string): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) throw error
  return data
}
