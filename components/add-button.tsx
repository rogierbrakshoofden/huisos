// components/add-button.tsx
import React, { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'

interface AddButtonProps {
  onTaskClick: () => void
  onEventClick: () => void
}

export function AddButton({ onTaskClick, onEventClick }: AddButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleTaskClick = () => {
    onTaskClick()
    setIsOpen(false)
  }

  const handleEventClick = () => {
    onEventClick()
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full
          bg-emerald-600 hover:bg-emerald-700
          text-white font-bold text-xl
          flex items-center justify-center
          shadow-lg transition-all duration-200
          ${isOpen ? 'bg-emerald-700 shadow-xl' : ''}
        `}
      >
        <Plus size={28} />
      </button>

      {isOpen && (
        <div
          className="
            absolute top-20 right-0 w-48
            bg-slate-900/95 border border-slate-800/50
            rounded-lg p-2 backdrop-blur-md shadow-2xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          <button
            onClick={handleTaskClick}
            className="
              w-full text-left px-4 py-3 rounded-md text-sm
              text-white hover:bg-slate-800 transition-colors
              flex items-center gap-3
            "
          >
            <span className="text-lg">📋</span>
            <span>New Task</span>
          </button>

          <button
            onClick={handleEventClick}
            className="
              w-full text-left px-4 py-3 rounded-md text-sm
              text-white hover:bg-slate-800 transition-colors
              flex items-center gap-3
            "
          >
            <span className="text-lg">📅</span>
            <span>New Event</span>
          </button>
        </div>
      )}
    </div>
  )
}
