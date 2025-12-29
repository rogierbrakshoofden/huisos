import React, { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Task, FamilyMember, Frequency } from '@/types/huisos-v2'
import { FamilyMemberCircle } from '@/components/family-member-circle'

interface TaskModalProps {
  task?: Task | null
  familyMembers: FamilyMember[]
  isOpen: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  currentUserId?: string
}

export function TaskModal({
  task,
  familyMembers,
  isOpen,
  onClose,
  onSave,
  onDelete,
  currentUserId,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [recurrenceType, setRecurrenceType] = useState<'once' | 'repeating'>('once')
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [dueDate, setDueDate] = useState('')
  const [tokenValue, setTokenValue] = useState(1)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setAssigneeIds(task.assignee_ids || [])
      setRecurrenceType((task.recurrence_type as any) || 'once')
      setFrequency((task.frequency as Frequency) || 'daily')
      setDueDate(task.due_date || '')
      setTokenValue(task.token_value || 1)
      setNotes(task.notes || '')
    } else {
      // Reset for new task
      setTitle('')
      setDescription('')
      setAssigneeIds([])
      setRecurrenceType('once')
      setFrequency('daily')
      setDueDate('')
      setTokenValue(1)
      setNotes('')
    }
    setErrors({})
  }, [task, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less'
    }

    if (assigneeIds.length === 0) {
      newErrors.assignees = 'At least one person must be assigned'
    }

    if (recurrenceType === 'once' && dueDate) {
      const dueDateObj = new Date(dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (dueDateObj < today) {
        newErrors.dueDate = 'Due date cannot be in the past'
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
        description: description.trim() || undefined,
        assignee_ids: assigneeIds,
        recurrence_type: recurrenceType,
        frequency: recurrenceType === 'repeating' ? frequency : undefined,
        due_date: recurrenceType === 'once' ? dueDate : undefined,
        token_value: tokenValue,
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
    if (!task) return
    if (!confirm('Are you sure you want to delete this task?')) return

    setIsSaving(true)
    try {
      await onDelete?.(task.id)
      onClose()
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAssignee = (memberId: string) => {
    setAssigneeIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: '' }))
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
            {task ? 'Edit Task' : 'New Task'}
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
              placeholder="e.g., Wash dishes"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 resize-none"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Assign to <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {familyMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => toggleAssignee(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    assigneeIds.includes(member.id)
                      ? 'bg-slate-700 border-slate-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(member.id)}
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
            {errors.assignees && (
              <p className="text-red-400 text-sm mt-2">{errors.assignees}</p>
            )}
          </div>

          {/* Recurrence Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecurrenceType('once')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  recurrenceType === 'once'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                Once
              </button>
              <button
                onClick={() => setRecurrenceType('repeating')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  recurrenceType === 'repeating'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                Repeating
              </button>
            </div>
          </div>

          {/* Conditional: Due Date (if Once) */}
          {recurrenceType === 'once' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => {
                  setDueDate(e.target.value)
                  if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }))
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
              />
              {errors.dueDate && (
                <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>
              )}
            </div>
          )}

          {/* Conditional: Frequency (if Repeating) */}
          {recurrenceType === 'repeating' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Frequency
              </label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as Frequency)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="every_two_days">Every 2 days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Token Value */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Token Value
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={tokenValue}
              onChange={e => setTokenValue(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
            <p className="text-xs text-slate-500 mt-1">Tokens earned when completed</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes..."
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
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>

          {task && (
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
