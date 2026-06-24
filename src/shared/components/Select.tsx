import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from './cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  id?: string
}

function Select({ options, value, onValueChange, placeholder = 'Select...', label, error, disabled, id }: SelectProps) {
  const innerId = id || React.useId()

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={innerId} className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={innerId}
          className={cn(
            'flex h-11 min-h-[44px] w-full items-center justify-between rounded border bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-600',
            'disabled:cursor-not-allowed disabled:bg-neutral-100',
            error ? 'border-danger-500' : 'border-neutral-200 hover:border-neutral-300',
            !value && 'text-neutral-400'
          )}
          aria-invalid={!!error}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-neutral-200 bg-surface shadow-dropdown"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer items-center rounded px-3 py-2 text-sm text-neutral-700 outline-none hover:bg-neutral-100 data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check className="h-4 w-4 text-primary-600" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p role="alert" className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}

export { Select }
