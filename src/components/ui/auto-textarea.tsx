import * as React from 'react'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * 줄바꿈은 Enter를 쳤을 때만 생기고(자동 줄바꿈 없음), 스크롤 없이 내용에 맞춰
 * 높이·너비가 자동으로 늘어나는 텍스트영역. 가로로 긴 한 줄은 감싸지 않고
 * 텍스트영역(과 이를 담은 셀/카드)이 옆으로 늘어난다.
 */
export const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ className, value, onInput, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)

    function resize(el: HTMLTextAreaElement) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
      el.style.width = ''
      if (el.scrollWidth > el.clientWidth) el.style.width = `${el.scrollWidth + 2}px`
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
        wrap="off"
        onInput={e => {
          resize(e.currentTarget)
          onInput?.(e)
        }}
        className={cn(
          'block min-w-full whitespace-pre resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400',
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
