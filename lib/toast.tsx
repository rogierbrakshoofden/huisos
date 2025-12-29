'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = String(toastId++)
    const newToast = { id, message, type }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  return { toasts, toast, setToasts }
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-40 left-4 right-4 z-50 max-w-sm mx-auto space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 ${
            t.type === 'success'
              ? 'bg-green-900/80 border border-green-700 text-green-100'
              : t.type === 'error'
              ? 'bg-red-900/80 border border-red-700 text-red-100'
              : 'bg-blue-900/80 border border-blue-700 text-blue-100'
          }`}
        >
          <span className="text-sm font-medium">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 p-1 hover:bg-black/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
