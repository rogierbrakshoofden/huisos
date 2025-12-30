import { useCallback } from 'react'
import { useApp } from '@/lib/context-v2'
import { Task, Subtask } from '@/types/huisos-v2'
import confetti from 'canvas-confetti'

export function useTaskHandlers(
  currentUserId: string,
  toast: (message: string, type: 'success' | 'error') => void,
  setApiError: (error: string | null) => void
) {
  const { state, dispatch } = useApp()

  const handleSaveTask = useCallback(
    async (taskData: Partial<Task>, editingTask: Task | null) => {
      try {
        setApiError(null)

        if (editingTask) {
          // Update existing task
          const response = await fetch('/api/tasks/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: editingTask.id,
              ...taskData,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update task')
          }

          const updatedTask = await response.json()
          dispatch({
            type: 'UPDATE_TASK',
            payload: updatedTask as Task,
          })
          toast('Task updated ✓', 'success')
        } else {
          // Create new task
          const response = await fetch('/api/tasks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...taskData,
              created_by: currentUserId,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create task')
          }

          const newTask = await response.json()
          dispatch({
            type: 'ADD_TASK',
            payload: newTask as Task,
          })
          toast('Task created ✓', 'success')
        }
      } catch (err) {
        const message = (err as Error).message
        setApiError(message)
        toast(message, 'error')
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed to save task: ${message}`,
        })
        throw err
      }
    },
    [currentUserId, dispatch, setApiError, toast]
  )

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        setApiError(null)

        const response = await fetch('/api/tasks/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            actorId: currentUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete task')
        }

        dispatch({ type: 'DELETE_TASK', payload: taskId })
        toast('Task deleted', 'success')
      } catch (err) {
        const message = (err as Error).message
        setApiError(message)
        toast(message, 'error')
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed to delete task: ${message}`,
        })
        throw err
      }
    },
    [currentUserId, dispatch, setApiError, toast]
  )

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      try {
        setApiError(null)

        // Check if task has incomplete subtasks - complete them all first
        const taskSubtasks = state.subtasks.get(taskId) || []
        const incompleteSubtasks = taskSubtasks.filter(s => !s.completed)

        // Complete all incomplete subtasks first
        for (const subtask of incompleteSubtasks) {
          await fetch('/api/subtasks/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subtask_id: subtask.id,
              completed_by: currentUserId,
            }),
          })
        }

        // Then complete the main task
        const response = await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            completedBy: currentUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to complete task')
        }

        const completedTask = await response.json()
        dispatch({
          type: 'UPDATE_TASK',
          payload: completedTask as Task,
        })

        toast('✨ Chore completed! Tokens earned!', 'success')

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      } catch (err) {
        console.error('Failed to complete task:', err)
        const message = (err as Error).message
        setApiError(message)
        toast(message, 'error')
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed: ${message}`,
        })
      }
    },
    [currentUserId, dispatch, setApiError, state.subtasks, toast]
  )

  const handleToggleSubtask = useCallback(
    async (subtaskId: string) => {
      try {
        // Find the subtask to get context
        let targetSubtask: Subtask | null = null
        for (const [, subtasks] of state.subtasks) {
          const found = subtasks.find(s => s.id === subtaskId)
          if (found) {
            targetSubtask = found
            break
          }
        }

        if (!targetSubtask) return

        // Toggle completion status
        if (!targetSubtask.completed) {
          // Complete the subtask
          const response = await fetch('/api/subtasks/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subtask_id: subtaskId,
              completed_by: currentUserId,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to complete subtask')
          }

          const updatedSubtask = await response.json()
          dispatch({
            type: 'UPDATE_SUBTASK',
            payload: {
              taskId: targetSubtask.parent_task_id,
              subtask: updatedSubtask as Subtask,
            },
          })
          toast('✓ Subtask completed', 'success')
        }
      } catch (err) {
        console.error('Failed to toggle subtask:', err)
        toast((err as Error).message, 'error')
      }
    },
    [currentUserId, dispatch, state.subtasks, toast]
  )

  return {
    handleSaveTask,
    handleDeleteTask,
    handleCompleteTask,
    handleToggleSubtask,
  }
}
