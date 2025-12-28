import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FamilyMemberCircle } from '@/components/family-member-circle'
import type { Database } from '@/types/database'

type FamilyMember = Database['public']['Tables']['family_members']['Row']

interface AddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: FamilyMember[]
  onAddTask: (task: {
    title: string
    assigned_to: string
    due_date: string | null
    note: string | null
    created_by: string
  }) => Promise<void>
  onAddEvent: (event: {
    title: string
    datetime: string | null
    all_day: boolean
    member_ids: string[]
    notes: string | null
  }) => Promise<void>
  defaultTab?: 'task' | 'event'
}

export function AddModal({
  open,
  onOpenChange,
  members,
  onAddTask,
  onAddEvent,
  defaultTab = 'task',
}: AddModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)

  // Task form state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskNote, setTaskNote] = useState('')

  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventAllDay, setEventAllDay] = useState(false)
  const [eventMembers, setEventMembers] = useState<string[]>([])
  const [eventNotes, setEventNotes] = useState('')

  const resetForms = () => {
    setTaskTitle('')
    setTaskAssignee('')
    setTaskDueDate('')
    setTaskNote('')
    setEventTitle('')
    setEventDate('')
    setEventTime('')
    setEventAllDay(false)
    setEventMembers([])
    setEventNotes('')
  }

  const handleAddTask = async () => {
    if (!taskTitle || !taskAssignee) return
    setLoading(true)
    try {
      await onAddTask({
        title: taskTitle,
        assigned_to: taskAssignee,
        due_date: taskDueDate || null,
        note: taskNote || null,
        created_by: taskAssignee, // For now, same as assignee
      })
      resetForms()
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async () => {
    if (!eventTitle) return
    setLoading(true)
    try {
      let datetime: string | null = null
      if (eventDate && !eventAllDay && eventTime) {
        datetime = `${eventDate}T${eventTime}:00`
      } else if (eventDate && eventAllDay) {
        datetime = `${eventDate}T00:00:00`
      }

      await onAddEvent({
        title: eventTitle,
        datetime,
        all_day: eventAllDay,
        member_ids: eventMembers,
        notes: eventNotes || null,
      })
      resetForms()
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEventMember = (memberId: string) => {
    setEventMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'task' | 'event')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
          </TabsList>

          <TabsContent value="task" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">What needs to be done?</Label>
              <Input
                id="task-title"
                placeholder="e.g., Boodschappen halen"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to</Label>
              <div className="flex gap-2 flex-wrap">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setTaskAssignee(member.id)}
                    className={`p-1 rounded-full transition-all ${
                      taskAssignee === member.id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <FamilyMemberCircle
                      initials={member.initials}
                      color={member.color}
                      size="md"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due">Due date (optional)</Label>
              <Input
                id="task-due"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-note">Note (optional)</Label>
              <Input
                id="task-note"
                placeholder="Any extra details..."
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddTask}
              disabled={!taskTitle || !taskAssignee || loading}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </TabsContent>

          <TabsContent value="event" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event name</Label>
              <Input
                id="event-title"
                placeholder="e.g., Tandarts Quinten"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventAllDay}
                  onChange={(e) => setEventAllDay(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span className="text-sm">All day</span>
              </label>

              {!eventAllDay && (
                <div className="flex-1">
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Who&apos;s involved?</Label>
              <div className="flex gap-2 flex-wrap">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleEventMember(member.id)}
                    className={`p-1 rounded-full transition-all ${
                      eventMembers.includes(member.id)
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <FamilyMemberCircle
                      initials={member.initials}
                      color={member.color}
                      size="md"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-notes">Notes (optional)</Label>
              <Input
                id="event-notes"
                placeholder="Any extra details..."
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddEvent}
              disabled={!eventTitle || loading}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Event'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
