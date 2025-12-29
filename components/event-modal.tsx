import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Event, FamilyMember } from '@/types/huisos-v2'
import { FamilyMemberCircle } from '@/components/family-member-circle'

interface EventModalProps {
  event?: Event | null
  familyMembers: FamilyMember[]
  isOpen: boolean
  onClose: () => void
  onSave: (event: Partial<Event>) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
}

export function EventModal({
  event,
  familyMembers,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('')
  const [datetime, setDatetime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [recurring, setRecurring] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDatetime(event.datetime || '')
      setAllDay(event.all_day || false)
      setMemberIds(event.member_ids || [])
      setRecurring(event.recurring || null)
      setNotes(event.notes || '')
    } else {
      // Reset for new event
      setTitle('')
      setDatetime('')
      setAllDay(false)
      setMemberIds([])
      setRecurring(null)
      setNotes('')
    }
    setErrors({})
  }, [event, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less'
    }

    if (!allDay && !datetime) {
      newErrors.datetime = 'Date and time are required'
    }

    if (memberIds.length === 0) {
      newErrors.members = 'At least one member must be assigned'
    }

    if (!allDay && datetime) {
      const datetimeObj = new Date(datetime)
      const now = new Date()
      if (datetimeObj < now) {
        newErrors.datetime = 'Event date/time cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        datetime: datetime || undefined,
        all_day: allDay,
        member_ids: memberIds,
        recurring: (recurring as any) || null,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    if (!confirm('Are you sure you want to delete this event?')) return

    setIsSaving(true)
    try {
      await onDelete?.(event.id)
      onClose()
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
    if (errors.members) {
      setErrors(prev => ({ ...prev, members: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full bg-slate-900 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-10">
          <h2 className="text-lg font-semibold text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }))
              }}
              placeholder="e.g., Family dinner"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
          </div>

          {/* All Day Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setAllDay(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  !allDay
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                Specific Time
              </button>
              <button
                onClick={() => setAllDay(true)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  allDay
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                All Day
              </button>
            </div>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {allDay ? 'Date' : 'Date & Time'} <span className="text-red-400">*</span>
            </label>
            <input
              type={allDay ? 'date' : 'datetime-local'}
              value={datetime}
              onChange={e => {
                setDatetime(e.target.value)
                if (errors.datetime) setErrors(prev => ({ ...prev, datetime: '' }))
              }}
              min={allDay ? new Date().toISOString().split('T')[0] : undefined}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
            {errors.datetime && (
              <p className="text-red-400 text-sm mt-1">{errors.datetime}</p>
            )}
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Attendees <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {familyMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    memberIds.includes(member.id)
                      ? 'bg-slate-700 border-slate-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={memberIds.includes(member.id)}
                    readOnly
                    className="w-5 h-5 cursor-pointer"
                  />
                  <FamilyMemberCircle
                    initials={member.initials}
                    color={member.color}
                    size="sm"
                  />
                  <span className="text-white font-medium flex-1 text-left">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
            {errors.members && (
              <p className="text-red-400 text-sm mt-2">{errors.members}</p>
            )}
          </div>

          {/* Recurring */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Repeating
            </label>
            <select
              value={recurring || ''}
              onChange={e => setRecurring(e.target.value || null)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            >
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 resize-none"
            />
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-800 bg-slate-900 p-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>
          </div>

          {event && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
