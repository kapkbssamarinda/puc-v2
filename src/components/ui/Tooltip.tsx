"use client"

import { useState, useRef, useId, useEffect, type ReactNode, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), 200)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }
  const showNow = () => setVisible(true)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const posClass: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        onFocus: showNow,
        onBlur: hide,
        'aria-describedby': tooltipId,
      })
    : children

  return (
    <span className="relative inline-flex items-center" onMouseEnter={show} onMouseLeave={hide}>
      {trigger}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 w-64 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg',
            'pointer-events-none whitespace-normal leading-relaxed',
            posClass[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

export { Tooltip }
