import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OmitHTMLPrefix = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>

interface InputProps extends OmitHTMLPrefix {
  label?: string
  helperText?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, prefix, suffix, containerClassName, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-gray-500 pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-0 focus:border-secondary',
              'disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed',
              'transition-colors',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              prefix && 'pl-9',
              suffix && 'pr-9',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-gray-500 pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
export type { InputProps }
