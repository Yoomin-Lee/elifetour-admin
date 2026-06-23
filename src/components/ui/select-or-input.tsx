import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FieldSelect } from './field-select'

const CUSTOM = '__CUSTOM__'

interface SelectOrInputProps {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export function SelectOrInput({ value, onChange, options, placeholder = '선택…', className }: SelectOrInputProps) {
  const [isCustom, setIsCustom] = useState(false)

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="직접 입력"
          autoFocus
          className={`input h-7 text-sm flex-1 min-w-0 ${className ?? ''}`}
        />
        <button
          type="button"
          onClick={() => { setIsCustom(false); onChange('') }}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
          title="목록으로"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  const baseOptions = value !== '' && !options.includes(value) ? [value, ...options] : options
  const fieldOptions = [...baseOptions, { value: CUSTOM, label: '✏ 직접 입력' }]

  return (
    <FieldSelect
      value={value}
      options={fieldOptions}
      onChange={v => {
        if (v === CUSTOM) { setIsCustom(true); onChange('') }
        else onChange(v)
      }}
      placeholder={placeholder}
      className={`h-7 text-sm ${className ?? ''}`}
    />
  )
}
