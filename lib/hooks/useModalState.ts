import { useState, useCallback } from 'react'
import { Task, Event } from '@/types/huisos-v2'

export function useModalState() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isRewardStoreOpen, setIsRewardStoreOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleOpenNewTask = useCallback(() => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }, [])

  const handleOpenNewEvent = useCallback(() => {
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event)
    setIsEventModalOpen(true)
  }, [])

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
    setApiError(null)
  }, [])

  const handleCloseEventModal = useCallback(() => {
    setIsEventModalOpen(false)
    setEditingEvent(null)
    setApiError(null)
  }, [])

  return {
    // Task modal state
    isTaskModalOpen,
    editingTask,
    handleOpenNewTask,
    handleEditTask,
    handleCloseTaskModal,
    
    // Event modal state
    isEventModalOpen,
    editingEvent,
    handleOpenNewEvent,
    handleEditEvent,
    handleCloseEventModal,
    
    // Reward store state
    isRewardStoreOpen,
    setIsRewardStoreOpen,
    
    // Error state
    apiError,
    setApiError,
  }
}
