import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react'
import {
  fetchAllHistoryLogs,
  updateHistoryLog,
  deleteHistoryLog,
  addHistoryLog,
  type HistoryRow,
} from '@/lib/queries/voyages'
import { voyageTitle } from '@/types/database'
import { YearSelect } from '@/components/ui/year-select'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}/${mm}/${dd} ${hh}:${min}`
}

export default function HistoryTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    const el = editTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [editText, editingId])

  const { data = [], isLoading } = useQuery({
    queryKey: ['all-history'],
    queryFn: fetchAllHistoryLogs,
  })

  const years = useMemo(() => {
    const ys = new Set<string>()
    data.forEach(r => {
      const yr = r.voyages?.departure_date?.slice(0, 4)
      if (yr) ys.add(yr)
    })
    return Array.from(ys).sort().reverse()
  }, [data])

  const filtered = data
    .filter(r => {
      if (yearFilter !== 'ALL' && !r.voyages?.departure_date?.startsWith(yearFilter)) return false
      return !filter ||
        (r.voyages && voyageTitle(r.voyages).toLowerCase().includes(filter.toLowerCase())) ||
        (r.author ?? '').includes(filter) ||
        r.content.includes(filter)
    })
    .sort((a, b) => {
      const depA = a.voyages?.departure_date ?? ''
      const depB = b.voyages?.departure_date ?? ''
      if (depB !== depA) return depB.localeCompare(depA)
      return b.logged_at.localeCompare(a.logged_at)
    })

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateHistoryLog(id, content),
    onSuccess: () => {
      setEditingId(null)
      setEditText('')
      qc.invalidateQueries({ queryKey: ['all-history'] })
      toast.success('수정됐습니다')
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHistoryLog(id),
    onError: () => {
      qc.invalidateQueries({ queryKey: ['all-history'] })
      toast.error('삭제에 실패했습니다')
    },
  })

  function startEdit(r: HistoryRow) {
    setEditingId(r.id)
    setEditText(r.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  function saveEdit(id: string) {
    if (!editText.trim()) return
    updateMutation.mutate({ id, content: editText.trim() })
  }

  function handleDelete(r: HistoryRow) {
    qc.setQueryData<HistoryRow[]>(['all-history'], prev =>
      (prev ?? []).filter(row => row.id !== r.id)
    )
    deleteMutation.mutate(r.id)
    const restore = () => addHistoryLog(r.voyage_id, r.content, r.author ?? '')
      .then(() => qc.invalidateQueries({ queryKey: ['all-history'] }))
      .catch(() => toast.error('복원에 실패했습니다'))
    toast.custom(id => (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-200/60 text-sm min-w-[260px]">
        <span className="text-slate-700 flex-1">히스토리가 삭제됐습니다.</span>
        <button
          onClick={() => { toast.dismiss(id); restore() }}
          className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition"
        >
          복원
        </button>
      </div>
    ), { position: 'bottom-center', duration: 3500 })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">히스토리</h1>
          <p className="text-sm text-slate-400">전체 {data.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelect value={yearFilter} years={years} onChange={setYearFilter} />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="행사명·작성자·내용 검색"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[760px] w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-36">행사명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-32">일시</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">작성자</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-500">내용</th>
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">불러오는 중…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">데이터가 없습니다</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="group hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.voyages ? (
                    <button
                      onClick={() => navigate(`/voyages?tab=항차검색&voyage=${r.voyage_id}`)}
                      className="group flex items-center gap-1 font-medium text-slate-800 hover:text-brand transition"
                      title="항차 상세에서 보기"
                    >
                      {voyageTitle(r.voyages)}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                    </button>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">
                  {formatDateTime(r.logged_at)}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.author ?? '—'}</td>
                <td className="px-3 py-2 text-slate-700 leading-relaxed">
                  {editingId === r.id ? (
                    <textarea
                      ref={editTextareaRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(r.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      rows={1}
                      autoFocus
                      className="w-full resize-none rounded border border-brand px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand/30"
                      style={{ minHeight: '4rem' }}
                    />
                  ) : (
                    r.content
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => saveEdit(r.id)}
                        disabled={!editText.trim() || updateMutation.isPending}
                        className="p-1 rounded text-brand hover:bg-brand/10 transition disabled:opacity-40"
                        aria-label="저장"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100 transition"
                        aria-label="취소"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        aria-label="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
