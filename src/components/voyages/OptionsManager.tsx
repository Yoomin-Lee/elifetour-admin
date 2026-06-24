import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

type Option = { id: string; label: string; sort_order: number }

type Props = {
  title: string
  queryKey: string
  fetchFn: () => Promise<Option[]>
  addFn: (label: string) => Promise<Option>
  deleteFn: (id: string) => Promise<void>
  updateFn: (id: string, label: string) => Promise<void>
  onClose: () => void
}

export default function OptionsManager({ title, queryKey, fetchFn, addFn, deleteFn, updateFn, onClose }: Props) {
  const qc = useQueryClient()
  const { data: options = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: fetchFn })

  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const addMut = useMutation({
    mutationFn: () => addFn(newLabel.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setNewLabel(''); toast.success('추가됐습니다') },
    onError: () => toast.error('이미 존재하는 항목입니다'),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success('삭제되었습니다') },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const editMut = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => updateFn(id, label),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setEditingId(null); toast.success('수정됐습니다') },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">{title} 관리</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newLabel.trim() && addMut.mutate()}
            placeholder={`새 ${title} 입력`}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={() => newLabel.trim() && addMut.mutate()}
            disabled={!newLabel.trim() || addMut.isPending}
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-40 transition"
          >
            <Plus className="h-3.5 w-3.5" /> 추가
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 scrollbar-navy">
          {isLoading && <p className="text-xs text-slate-400 text-center py-4">불러오는 중…</p>}
          {options.map(opt => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 group">
              {editingId === opt.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editLabel.trim()) editMut.mutate({ id: opt.id, label: editLabel.trim() })
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="flex-1 rounded border border-brand/40 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                  <button
                    onClick={() => editLabel.trim() && editMut.mutate({ id: opt.id, label: editLabel.trim() })}
                    disabled={!editLabel.trim() || editMut.isPending}
                    className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{opt.label}</span>
                  <button
                    onClick={() => { setEditingId(opt.id); setEditLabel(opt.label) }}
                    className="hidden group-hover:flex rounded p-1 text-slate-400 hover:text-brand hover:bg-brand/5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => delMut.mutate(opt.id)}
                    disabled={delMut.isPending}
                    className="hidden group-hover:flex rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
