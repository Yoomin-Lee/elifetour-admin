import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
        checked
          ? 'border-brand bg-brand text-white'
          : 'border-slate-300 bg-white hover:border-brand/50',
        className,
      )}
      {...props}
    >
      <Check className={cn('h-3 w-3 transition-opacity', checked ? 'opacity-100' : 'opacity-0')} />
    </button>
  )
}
