import { statusOptions } from '../config/site'

const colorMap = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  slate:  'bg-slate-100 text-slate-600',
  red:    'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  amber:  'bg-amber-100 text-amber-700',
}

export default function StatusBadge({ type, value }) {
  const options = statusOptions[type] || []
  const opt = options.find((o) => o.value === value) || { label: value, color: 'slate' }
  return (
    <span className={`badge ${colorMap[opt.color] || colorMap.slate}`}>
      {opt.label}
    </span>
  )
}
