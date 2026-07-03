import * as React from 'react'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** 줄바꿈(Enter) 입력 가능하고, 스크롤 없이 내용에 맞춰 높이가 자동으로 늘어나는 텍스트영역 */
export const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ className, value, onInput, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)

    function resize(el: HTMLTextAreaElement) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }

    useLayoutEffect(() => {
      if (innerRef.current) resize(innerRef.current)
    }, [value])

    return (
      <textarea
        ref={node => {
          innerRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        value={value}
        rows={1}
        onInput={e => {
          resize(e.currentTarget)
          onInput?.(e)
        }}
        className={cn(
          'block w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    )
  },
)
AutoTextarea.displayName = 'AutoTextarea'
