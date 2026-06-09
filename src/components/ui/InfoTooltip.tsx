"use client"

import { Tooltip } from './Tooltip'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface InfoTooltipProps {
  text: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

function InfoTooltip({ text, side = 'top', className }: InfoTooltipProps) {
  return (
    <Tooltip content={text} side={side}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Informasi lebih lanjut"
        className={cn(
          'inline-flex items-center justify-center',
          'h-4 w-4 rounded-full text-[10px] font-bold',
          'bg-gray-200 text-gray-500 hover:bg-secondary hover:text-white',
          'transition-colors cursor-help',
          className,
        )}
      >
        ?
      </button>
    </Tooltip>
  )
}

export { InfoTooltip }
