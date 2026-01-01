import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { Event, FamilyMember } from '@/types/huisos-v2'

interface EventModalV4Props {
  event?: Event | null
  familyMembers: FamilyMember[]
  isOpen: boolean
  onClose: () => void
  onSave: (event: Partial<Event>) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
}

export function EventModalV4({
  event,
  familyMembers,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventModalV4Props) {
  const [title, setTitle] = useState('')
  const [datetime, setDatetime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDatetime(event.datetime || '')
      setAllDay(event.all_day || false)
      setMemberIds(event.member_ids || [])
      setNotes(event.notes || '')
    } else {
      setTitle('')
      setDatetime('')
      setAllDay(false)
      setMemberIds([])
      setNotes('')
    }
    setErrors({})
  }, [event, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (title.length > 100) newErrors.title = 'Title must be 100 characters or less'
    if (!allDay && !datetime) newErrors.datetime = 'Date and time are required'
    if (memberIds.length === 0) newErrors.members = 'At least one member must be assigned'
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
    if (!event || !confirm('Delete this event?')) return
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
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
    if (errors.members) setErrors(prev => ({ ...prev, members: '' }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl z-10">
          <h2 className="text-xl font-bold text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
          </div>

          {/* All Day Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAllDay(false)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  !allDay
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                Specific Time
              </button>
              <button
                onClick={() => setAllDay(true)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  allDay
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                All Day
              </button>
            </div>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.datetime && <p className="text-red-400 text-sm mt-1">{errors.datetime}</p>}
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Attendees <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {familyMembers.map(member => {
                const isSelected = memberIds.includes(member.id)
                const colorMap: Record<string, string> = {
                  purple: 'bg-purple-600',
                  green: 'bg-green-600',
                  orange: 'bg-orange-600',
                  yellow: 'bg-yellow-600',
                  blue: 'bg-blue-600',
                }
                const bgColor = colorMap[member.color] || 'bg-slate-600'

                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center font-bold text-sm text-white`}>
                      {member.initials}
                    </div>
                    <span className="text-sm font-medium text-white flex-1 text-left">
                      {member.name}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                  </button>
                )
              })}
            </div>
            {errors.members && <p className="text-red-400 text-sm mt-2">{errors.members}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 text-sm">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl p-6 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-slate-800/50 text-white rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold shadow-lg shadow-blue-600/20"
            >
              {isSaving ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>
          </div>

          {event && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/30 transition-colors disabled:opacity-50 font-semibold"
            >
              Delete Event
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
