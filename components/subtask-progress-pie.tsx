'use client'

import React from 'react'

interface SubtaskProgressPieProps {
  completed: number
  total: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SubtaskProgressPie({
  completed,
  total,
  color = '#8B5CF6',
  size = 'md',
}: SubtaskProgressPieProps) {
  const sizeMap = {
    sm: { size: 24, strokeWidth: 2 },
    md: { size: 40, strokeWidth: 2.5 },
    lg: { size: 60, strokeWidth: 3 },
  }

  const { size: dimension, strokeWidth } = sizeMap[size]
  const radius = (dimension - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = total === 0 ? 0 : (completed / total) * 100
  const offset = circumference - (percentage / 100) * circumference
  const center = dimension / 2

  return (
    <div className="relative inline-flex items-center justify-center group">
      <svg width={dimension} height={dimension} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#475569"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Center text */}
      <div className="absolute flex items-center justify-center">
        <span className={`font-semibold text-slate-200 ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          {total === 0 ? '—' : `${completed}/${total}`}
        </span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-slate-700">
        {completed} of {total} completed
      </div>
    </div>
  )
}
