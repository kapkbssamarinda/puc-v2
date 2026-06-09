import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'purple' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700 border-gray-200',
  success:  'bg-green-50 text-green-700 border-green-200',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  info:     'bg-blue-50 text-blue-700 border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border-purple-200',
  muted:    'bg-gray-50 text-gray-500 border-gray-100',
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
export type { BadgeVariant }
