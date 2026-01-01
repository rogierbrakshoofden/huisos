import { useState, useEffect } from 'react'
import { X, Check, Trash2, Plus, GripVertical } from 'lucide-react'
import { Task, FamilyMember, RecurrenceType, Subtask } from '@/types/huisos-v2'
import { AssigneeCircles } from '@/components/assignee-circles'

interface TaskModalV4Props {
  task?: Task | null
  familyMembers: FamilyMember[]
  isOpen: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  currentUserId?: string
}

export function TaskModalV4({
  task,
  familyMembers,
  isOpen,
  onClose,
  onSave,
  onDelete,
  currentUserId,
}: TaskModalV4Props) {
  const [title, setTitle] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [tokenValue, setTokenValue] = useState<number>(1)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('once')
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setAssigneeIds(Array.isArray(task.assigned_to) ? task.assigned_to : task.assigned_to ? [task.assigned_to] : [])
      setDueDate(task.due_date || '')
      setNote(task.note || '')
      setTokenValue(task.token_value || 1)
      setRecurrenceType(task.recurrence_type || 'once')
      setRotationEnabled(task.rotation_enabled || false)
      setSubtasks([])
      setNewSubtaskTitle('')
    } else {
      setTitle('')
      setAssigneeIds([])
      setDueDate('')
      setNote('')
      setTokenValue(1)
      setRecurrenceType('once')
      setRotationEnabled(false)
      setSubtasks([])
      setNewSubtaskTitle('')
    }
    setErrors({})
  }, [task, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (title.length > 100) newErrors.title = 'Title must be 100 characters or less'
    if (assigneeIds.length === 0) newErrors.assignees = 'At least one person must be assigned'
    if (tokenValue < 0) newErrors.tokenValue = 'Token value cannot be negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        assigned_to: assigneeIds,
        due_date: dueDate || undefined,
        note: note.trim() || undefined,
        token_value: tokenValue,
        recurrence_type: recurrenceType,
        rotation_enabled: rotationEnabled,
      })
      onClose()
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task?')) return
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
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
    if (errors.assignees) setErrors(prev => ({ ...prev, assignees: '' }))
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    setSubtasks([
      ...subtasks,
      { id: `temp-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ])
    setNewSubtaskTitle('')
  }

  const removeSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl z-10">
          <h2 className="text-xl font-bold text-white">
            {task ? 'Edit Task' : 'New Task'}
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
              placeholder="e.g., Wash dishes"
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
          </div>

          {/* Assignees - Clean Circle Style */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-4">
              Assign to <span className="text-red-400">*</span>
            </label>

            {/* Assignee selector - Just circles, clean */}
            <div className="flex flex-wrap gap-3">
              {familyMembers.map(member => {
                const isSelected = assigneeIds.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssignee(member.id)}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center font-bold text-white transition-all
                      ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-blue-500/30'
                          : 'opacity-60 hover:opacity-100'
                      }
                    `}
                    style={{ backgroundColor: member.color }}
                    title={member.name}
                  >
                    {member.initials}
                  </button>
                )
              })}
            </div>
            {errors.assignees && <p className="text-red-400 text-sm mt-3">{errors.assignees}</p>}
          </div>

          {/* Rotation */}
          {recurrenceType === 'repeating' && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rotationEnabled}
                  onChange={e => setRotationEnabled(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-300">
                  Enable automatic rotation
                </span>
              </label>
              <p className="text-xs text-slate-400 mt-2">
                Automatically assign to the next person each time the task repeats
              </p>
            </div>
          )}

          {/* Token Value */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Token Value
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={tokenValue}
              onChange={e => {
                setTokenValue(Math.max(0, parseInt(e.target.value) || 0))
                if (errors.tokenValue) setErrors(prev => ({ ...prev, tokenValue: '' }))
              }}
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.tokenValue && <p className="text-red-400 text-sm mt-1">{errors.tokenValue}</p>}
            <p className="text-xs text-slate-500 mt-1">Points earned on completion</p>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Subtasks</label>
            
            {/* Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-2 mb-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        setSubtasks(
                          subtasks.map(st =>
                            st.id === subtask.id ? { ...st, completed: !st.completed } : st
                          )
                        )
                      }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addSubtask()
                  }
                }}
                placeholder="Add subtask..."
                className="flex-1 px-4 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-xl text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Recurrence</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceType('once')}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  recurrenceType === 'once'
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                Once
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType('repeating')}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  recurrenceType === 'repeating'
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                }`}
              >
                Repeating
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Notes</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any additional notes..."
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
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-semibold shadow-lg shadow-emerald-600/20"
            >
              {isSaving ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>

          {task && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-900/30 transition-colors disabled:opacity-50 font-semibold"
            >
              Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
