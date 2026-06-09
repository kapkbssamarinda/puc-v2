import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AlertVariant = 'info' | 'warning' | 'error' | 'success'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  title?: string
  icon?: ReactNode
}

const config: Record<AlertVariant, { container: string; icon: string; defaultIcon: string }> = {
  info:    { container: 'bg-blue-50 border-blue-200 text-blue-800',    icon: 'text-blue-500',  defaultIcon: 'ℹ' },
  warning: { container: 'bg-amber-50 border-amber-200 text-amber-800', icon: 'text-amber-500', defaultIcon: '⚠' },
  error:   { container: 'bg-red-50 border-red-200 text-red-800',       icon: 'text-red-500',   defaultIcon: '✕' },
  success: { container: 'bg-green-50 border-green-200 text-green-800', icon: 'text-green-500', defaultIcon: '✓' },
}

function Alert({ className, variant = 'info', title, icon, children, ...props }: AlertProps) {
  const c = config[variant]
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-lg border p-4', c.container, className)}
      {...props}
    >
      <span className={cn('mt-0.5 shrink-0 text-lg leading-none', c.icon)}>
        {icon ?? c.defaultIcon}
      </span>
      <div className="flex flex-col gap-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  )
}

export { Alert }
export type { AlertVariant }
