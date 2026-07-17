import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, containerClassName, id, children, ...props }, ref) => {
    // useId menjamin id unik meski dua select berlabel sama di satu halaman
    const autoId = useId()
    const selectId = id ?? autoId
    const messageId = `${selectId}-message`
    const hasMessage = Boolean(error || helperText)
    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-0 focus:border-secondary',
            'disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed',
            'transition-colors appearance-none',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")]',
            'bg-[position:right_0.5rem_center] bg-[size:1.25rem] bg-no-repeat pr-9',
            error ? 'border-red-500' : 'border-gray-300',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p id={messageId} className="text-xs text-red-600">{error}</p>}
        {helperText && !error && <p id={messageId} className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
