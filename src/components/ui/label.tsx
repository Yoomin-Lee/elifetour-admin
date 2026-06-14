import * as React from 'react'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-xs font-semibold text-slate-500 mb-1', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'
