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
    query = query.contains('assignee_ids', `["${userId}"]`)
  }

  const { data, error } = await query
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Task[]) || []
}

/**
 * Fetch events for a specific user or all events
 */
export async function fetchEvents(userId?: string): Promise<Event[]> {
  let query = supabase.from('events').select('*')

  if (userId && userId !== 'everybody') {
    query = query.contains('member_ids', `["${userId}"]`)
  }

  const { data, error } = await query
    .order('datetime', { ascending: true })

  if (error) throw error
  return (data as Event[]) || []
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
  task: Partial<Task>,
  userId: string
): Promise<Task> {
  const { data, error } = await (supabase
    .from('tasks')
    .insert({
      title: task.title || '',
      description: task.description,
      recurrence_type: task.recurrence_type || 'once',
      frequency: task.frequency,
      recurrence_end_date: task.recurrence_end_date,
      assignee_ids: task.assignee_ids || [],
      rotation_enabled: task.rotation_enabled || false,
      rotation_index: task.rotation_index || 0,
      rotation_exclude_ids: task.rotation_exclude_ids || [],
      due_date: task.due_date,
      notes: task.notes,
      token_value: task.token_value || 1,
      created_by: userId,
    }) as any)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const updateObj: any = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) updateObj.title = updates.title
  if (updates.description !== undefined) updateObj.description = updates.description
  if (updates.recurrence_type !== undefined) updateObj.recurrence_type = updates.recurrence_type
  if (updates.frequency !== undefined) updateObj.frequency = updates.frequency
  if (updates.recurrence_end_date !== undefined) updateObj.recurrence_end_date = updates.recurrence_end_date
  if (updates.assignee_ids !== undefined) updateObj.assignee_ids = updates.assignee_ids
  if (updates.rotation_enabled !== undefined) updateObj.rotation_enabled = updates.rotation_enabled
  if (updates.rotation_index !== undefined) updateObj.rotation_index = updates.rotation_index
  if (updates.rotation_exclude_ids !== undefined) updateObj.rotation_exclude_ids = updates.rotation_exclude_ids
  if (updates.completed !== undefined) updateObj.completed = updates.completed
  if (updates.completed_at !== undefined) updateObj.completed_at = updates.completed_at
  if (updates.completed_by !== undefined) updateObj.completed_by = updates.completed_by
  if (updates.completed_date !== undefined) updateObj.completed_date = updates.completed_date
  if (updates.due_date !== undefined) updateObj.due_date = updates.due_date
  if (updates.notes !== undefined) updateObj.notes = updates.notes
  if (updates.token_value !== undefined) updateObj.token_value = updates.token_value

  const { data, error } = await (supabase
    .from('tasks')
    .update(updateObj) as any)
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
  const { data: task, error: updateError } = await (supabase
    .from('tasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }) as any)
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
    await (supabase.from('tokens').insert({
      member_id: userId,
      amount: task.token_value,
      reason: `Completed: ${task.title}`,
      task_completion_id: taskId,
    }) as any)
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
  event: Partial<Event>,
  userId: string
): Promise<Event> {
  const { data, error } = await (supabase
    .from('events')
    .insert({
      title: event.title || '',
      datetime: event.datetime,
      all_day: event.all_day || false,
      member_ids: event.member_ids || [],
      notes: event.notes,
    }) as any)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  const updateObj: any = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) updateObj.title = updates.title
  if (updates.datetime !== undefined) updateObj.datetime = updates.datetime
  if (updates.all_day !== undefined) updateObj.all_day = updates.all_day
  if (updates.member_ids !== undefined) updateObj.member_ids = updates.member_ids
  if (updates.notes !== undefined) updateObj.notes = updates.notes

  const { data, error } = await (supabase
    .from('events')
    .update(updateObj) as any)
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
  const { error } = await (supabase
    .from('activity_log')
    .insert({
      actor_id: log.actor_id,
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      metadata: log.metadata,
    }) as any)

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
  const { data, error } = await (supabase
    .from('subtasks')
    .insert({
      parent_task_id: parentTaskId,
      title,
      description,
      order_index: orderIndex,
    }) as any)
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
  const updateObj: any = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) updateObj.title = updates.title
  if (updates.description !== undefined) updateObj.description = updates.description
  if (updates.completed !== undefined) updateObj.completed = updates.completed
  if (updates.completed_at !== undefined) updateObj.completed_at = updates.completed_at
  if (updates.completed_by !== undefined) updateObj.completed_by = updates.completed_by
  if (updates.order_index !== undefined) updateObj.order_index = updates.order_index

  const { data, error } = await (supabase
    .from('subtasks')
    .update(updateObj) as any)
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
  const { data, error } = await (supabase
    .from('subtasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      updated_at: new Date().toISOString(),
    }) as any)
    .eq('id', subtaskId)
    .select()
    .single()

  if (error) throw error
  return data
}
