import React, { useState, useEffect } from 'react'
import { X, ChevronDown, Trash2, GripVertical, Plus } from 'lucide-react'
import { Task, FamilyMember, Frequency, Subtask } from '@/types/huisos-v2'
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
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Subtask state
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setAssigneeIds(task.assigned_to ? [task.assigned_to] : [])
      setDueDate(task.due_date || '')
      setNote(task.note || '')
      
      // Load subtasks if editing existing task
      if (task.id) {
        loadSubtasks(task.id)
      }
    } else {
      // Reset for new task
      setTitle('')
      setAssigneeIds([])
      setDueDate('')
      setNote('')
      setSubtasks([])
    }
    setErrors({})
    setNewSubtaskTitle('')
    setShowSubtaskInput(false)
    setEditingSubtaskId(null)
  }, [task, isOpen])

  const loadSubtasks = async (taskId: string) => {
    try {
      const response = await fetch(`/api/subtasks/list?parent_task_id=${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setSubtasks(data)
      }
    } catch (err) {
      console.error('Failed to load subtasks:', err)
    }
  }

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

    if (dueDate) {
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

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    if (!task?.id) return

    try {
      const response = await fetch('/api/subtasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_task_id: task.id,
          title: newSubtaskTitle.trim(),
          created_by: currentUserId,
        }),
      })

      if (response.ok) {
        const newSubtask = await response.json()
        setSubtasks(prev => [...prev, newSubtask])
        setNewSubtaskTitle('')
        setShowSubtaskInput(false)
      }
    } catch (err) {
      console.error('Failed to create subtask:', err)
    }
  }

  const handleUpdateSubtask = async (subtaskId: string, newTitle: string) => {
    try {
      const response = await fetch('/api/subtasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtask_id: subtaskId,
          title: newTitle.trim(),
          updated_by: currentUserId,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSubtasks(prev => prev.map(s => (s.id === subtaskId ? updated : s)))
        setEditingSubtaskId(null)
      }
    } catch (err) {
      console.error('Failed to update subtask:', err)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch('/api/subtasks/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtask_id: subtaskId,
          deleted_by: currentUserId,
        }),
      })

      if (response.ok) {
        setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
      }
    } catch (err) {
      console.error('Failed to delete subtask:', err)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      // Map to actual schema: assigned_to is a single string (first assignee), not an array
      const assignedTo = assigneeIds.length > 0 ? assigneeIds[0] : null

      await onSave({
        title: title.trim(),
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        note: note.trim() || undefined,
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

          {/* Due Date */}
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

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 resize-none"
            />
          </div>

          {/* Subtasks Section - Always show, but with different message for new tasks */}
          <div className="border-t border-slate-700 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">Subtasks</h3>
              {task?.id ? (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add
                </button>
              ) : null}
            </div>

            {!task?.id ? (
              <p className="text-slate-500 text-sm italic py-3">
                💡 Save the task first, then you can add subtasks
              </p>
            ) : (
              <>
                {subtasks.length === 0 && !showSubtaskInput && (
                  <p className="text-slate-500 text-sm italic py-3">
                    No subtasks yet. Add one to get started!
                  </p>
                )}

                {/* Subtask List */}
                <div className="space-y-2">
                  {subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg group"
                    >
                      <div className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={16} />
                      </div>

                      {editingSubtaskId === subtask.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingSubtaskTitle}
                          onChange={e => setEditingSubtaskTitle(e.target.value)}
                          onBlur={() => {
                            if (editingSubtaskTitle.trim() && editingSubtaskTitle !== subtask.title) {
                              handleUpdateSubtask(subtask.id, editingSubtaskTitle)
                            } else {
                              setEditingSubtaskId(null)
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (editingSubtaskTitle.trim()) {
                                handleUpdateSubtask(subtask.id, editingSubtaskTitle)
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-slate-500"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSubtaskId(subtask.id)
                            setEditingSubtaskTitle(subtask.title)
                          }}
                          className={`flex-1 text-left px-2 py-1 rounded text-sm ${
                            subtask.completed
                              ? 'text-slate-500 line-through'
                              : 'text-slate-200'
                          }`}
                        >
                          {subtask.title}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* New Subtask Input */}
                {showSubtaskInput && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg mt-2">
                    <input
                      autoFocus
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleAddSubtask()
                        } else if (e.key === 'Escape') {
                          setShowSubtaskInput(false)
                          setNewSubtaskTitle('')
                        }
                      }}
                      onBlur={() => {
                        if (!newSubtaskTitle.trim()) {
                          setShowSubtaskInput(false)
                        }
                      }}
                      placeholder="Type subtask title..."
                      className="flex-1 px-2 py-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskTitle.trim()}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                )}
              </>
            )}
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
