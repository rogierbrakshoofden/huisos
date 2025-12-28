import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { FamilyMemberCircle } from '@/components/family-member-circle'
import { AddModal } from '@/components/add-modal'
import type { Database } from '@/types/database'
import confetti from 'canvas-confetti'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

type FamilyMember = Database['public']['Tables']['family_members']['Row']
type Chore = Database['public']['Tables']['chores']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Event = Database['public']['Tables']['events']['Row']

interface ChoreWithAssignee extends Chore {
  assignee: FamilyMember | null
}

interface TaskWithAssignee extends Task {
  assignee: FamilyMember | null
}

interface EventWithMembers extends Event {
  members: FamilyMember[]
}

export default function Dashboard() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [chores, setChores] = useState<ChoreWithAssignee[]>([])
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [events, setEvents] = useState<EventWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalTab, setAddModalTab] = useState<'task' | 'event'>('task')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load family members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at')

      if (membersError) throw membersError

      const typedMembersData = (membersData || []) as FamilyMember[]

      // Load chores
      const { data: choresData, error: choresError } = await supabase
        .from('chores')
        .select('*')
        .order('created_at')

      if (choresError) throw choresError

      const typedChoresData = (choresData || []) as Chore[]

      // Match assignees to chores
      const choresWithAssignees: ChoreWithAssignee[] = typedChoresData.map((chore) => {
        const assigneeId = chore.eligible_member_ids[chore.current_member_idx]
        const assignee = typedMembersData.find((m) => m.id === assigneeId) || null
        return { ...chore, assignee }
      })

      // Load tasks (not completed)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (tasksError) throw tasksError

      const typedTasksData = (tasksData || []) as Task[]

      // Match assignees to tasks
      const tasksWithAssignees: TaskWithAssignee[] = typedTasksData.map((task) => {
        const assignee = typedMembersData.find((m) => m.id === task.assigned_to) || null
        return { ...task, assignee }
      })

      // Load events (next 14 days)
      const today = new Date()
      const twoWeeksFromNow = addDays(today, 14)
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('datetime', today.toISOString())
        .lte('datetime', twoWeeksFromNow.toISOString())
        .order('datetime', { ascending: true })

      if (eventsError) throw eventsError

      const typedEventsData = (eventsData || []) as Event[]

      // Match members to events
      const eventsWithMembers: EventWithMembers[] = typedEventsData.map((event) => {
        const eventMembers = event.member_ids
          .map((id) => typedMembersData.find((m) => m.id === id))
          .filter(Boolean) as FamilyMember[]
        return { ...event, members: eventMembers }
      })

      setMembers(typedMembersData)
      setChores(choresWithAssignees)
      setTasks(tasksWithAssignees)
      setEvents(eventsWithMembers)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function completeChore(chore: ChoreWithAssignee) {
    if (!chore.assignee) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: completionError } = await (supabase as any)
        .from('chore_completions')
        .insert({
          chore_id: chore.id,
          member_id: chore.assignee.id,
          date: new Date().toISOString().split('T')[0],
        })

      if (completionError) throw completionError

      // Award tokens if Quinten
      if (chore.assignee.initials === 'Q') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('tokens').insert({
          member_id: chore.assignee.id,
          amount: chore.token_value,
          reason: `Completed: ${chore.name}`,
        })
      }

      // Rotate to next person
      const nextIdx = (chore.current_member_idx + 1) % chore.eligible_member_ids.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('chores')
        .update({
          current_member_idx: nextIdx,
          last_completed_at: new Date().toISOString(),
          delegated_to: null,
          delegation_note: null,
        })
        .eq('id', chore.id)

      if (updateError) throw updateError

      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      await loadData()
    } catch (error) {
      console.error('Error completing chore:', error)
    }
  }

  async function completeTask(task: TaskWithAssignee) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (error) throw error

      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.7 },
      })

      await loadData()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  async function deleteTask(taskId: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  async function handleAddTask(taskData: {
    title: string
    assigned_to: string
    due_date: string | null
    note: string | null
    created_by: string
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('tasks').insert(taskData)
    if (error) throw error
    await loadData()
  }

  async function handleAddEvent(eventData: {
    title: string
    datetime: string | null
    all_day: boolean
    member_ids: string[]
    notes: string | null
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('events').insert(eventData)
    if (error) throw error
    await loadData()
  }

  const openAddModal = (tab: 'task' | 'event') => {
    setAddModalTab(tab)
    setAddModalOpen(true)
  }

  // Generate week days for calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">HuisOS</h1>
            <p className="text-muted-foreground">Family Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openAddModal('task')} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Task
            </Button>
            <Button onClick={() => openAddModal('event')} size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-1" />
              Event
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Chores */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Chores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chores.map((chore) => (
                  <div
                    key={chore.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <Checkbox
                      id={chore.id}
                      onCheckedChange={() => completeChore(chore)}
                    />
                    <label
                      htmlFor={chore.id}
                      className="flex-1 cursor-pointer select-none"
                    >
                      <p className="font-medium">{chore.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {chore.frequency.replace('_', ' ')}
                      </p>
                    </label>
                    {chore.assignee && (
                      <FamilyMemberCircle
                        initials={chore.assignee.initials}
                        color={chore.assignee.color}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
                {chores.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No chores for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => openAddModal('task')}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  >
                    <Checkbox
                      id={task.id}
                      onCheckedChange={() => completeTask(task)}
                    />
                    <label
                      htmlFor={task.id}
                      className="flex-1 cursor-pointer select-none"
                    >
                      <p className="font-medium">{task.title}</p>
                      {task.due_date && (
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(task.due_date), 'd MMM', { locale: nl })}
                        </p>
                      )}
                    </label>
                    {task.assignee && (
                      <FamilyMemberCircle
                        initials={task.assignee.initials}
                        color={task.assignee.color}
                        size="sm"
                      />
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No open tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <FamilyMemberCircle
                      initials={member.initials}
                      color={member.color}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.initials}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Week Calendar */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Coming Up</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => openAddModal('event')}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayEvents = events.filter(
                    (event) => event.datetime && isSameDay(parseISO(event.datetime), day)
                  )
                  const today = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] p-2 rounded-lg border ${
                        today
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-900/50'
                      }`}
                    >
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(day, 'EEE', { locale: nl })}
                        </p>
                        <p className={`text-lg font-bold ${today ? 'text-blue-400' : ''}`}>
                          {format(day, 'd')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors group relative"
                          >
                            <p className="font-medium truncate">{event.title}</p>
                            {!event.all_day && event.datetime && (
                              <p className="text-muted-foreground">
                                {format(parseISO(event.datetime), 'HH:mm')}
                              </p>
                            )}
                            {event.members.length > 0 && (
                              <div className="flex -space-x-1 mt-1">
                                {event.members.slice(0, 3).map((member) => (
                                  <FamilyMemberCircle
                                    key={member.id}
                                    initials={member.initials}
                                    color={member.color}
                                    size="sm"
                                    className="h-4 w-4 text-[8px]"
                                  />
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-600 rounded transition-all"
                            >
                              <Trash2 className="h-3 w-3 text-slate-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        members={members}
        onAddTask={handleAddTask}
        onAddEvent={handleAddEvent}
        defaultTab={addModalTab}
      />
    </div>
  )
}
