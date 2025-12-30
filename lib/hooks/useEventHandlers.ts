import { useCallback } from 'react'
import { useApp } from '@/lib/context-v2'
import { Event } from '@/types/huisos-v2'

export function useEventHandlers(
  currentUserId: string,
  toast: (message: string, type: 'success' | 'error') => void,
  setApiError: (error: string | null) => void
) {
  const { dispatch } = useApp()

  const handleSaveEvent = useCallback(
    async (eventData: Partial<Event>, editingEvent: Event | null) => {
      try {
        setApiError(null)

        if (editingEvent) {
          // Update existing event
          const response = await fetch('/api/events/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: editingEvent.id,
              ...eventData,
              actorId: currentUserId,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update event')
          }

          await response.json()
          // Let realtime sync handle the update to prevent duplicates
          toast('Event updated ✓', 'success')
        } else {
          // Create new event
          const response = await fetch('/api/events/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...eventData,
              created_by: currentUserId,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create event')
          }

          await response.json()
          // Let realtime sync handle the creation to prevent duplicates
          toast('Event created ✓', 'success')
        }
      } catch (err) {
        const message = (err as Error).message
        setApiError(message)
        toast(message, 'error')
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed to save event: ${message}`,
        })
        throw err
      }
    },
    [currentUserId, dispatch, setApiError, toast]
  )

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        setApiError(null)

        const response = await fetch('/api/events/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            actorId: currentUserId,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete event')
        }

        dispatch({ type: 'DELETE_EVENT', payload: eventId })
        toast('Event deleted', 'success')
      } catch (err) {
        const message = (err as Error).message
        setApiError(message)
        toast(message, 'error')
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload: `Failed to delete event: ${message}`,
        })
        throw err
      }
    },
    [currentUserId, dispatch, setApiError, toast]
  )

  return {
    handleSaveEvent,
    handleDeleteEvent,
  }
}
