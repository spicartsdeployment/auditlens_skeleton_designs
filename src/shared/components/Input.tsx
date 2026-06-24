import * as React from 'react'
import { cn } from './cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="ml-1 text-danger-500" aria-hidden>*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-describedby={cn(error ? errorId : '', hint ? hintId : '')}
            aria-invalid={!!error}
            className={cn(
              'w-full rounded border bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400',
              'min-h-[44px] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600',
              'disabled:bg-neutral-100 disabled:cursor-not-allowed',
              error ? 'border-danger-500 focus:ring-danger-500' : 'border-neutral-200 hover:border-neutral-300',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger-500 flex items-center gap-1">
            <span aria-hidden>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
