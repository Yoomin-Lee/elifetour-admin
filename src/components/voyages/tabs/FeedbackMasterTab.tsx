import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink, Search, Pencil, Trash2, Check, X, Settings2, Plus } from 'lucide-react'
import { FieldSelect } from '@/components/ui/field-select'
import {
  fetchAllFeedbackLogs,
  updateFeedbackLog,
  deleteFeedbackLog,
  type FeedbackRow,
} from '@/lib/queries/voyages'
import {
  fetchRegionOptions,
  addRegionOption,
  deleteRegionOption,
  updateRegionOption,
} from '@/lib/queries/regionOptions'
import { voyageTitle } from '@/types/database'
import type { FeedbackTag } from '@/types/database'

const TAGS: FeedbackTag[] = ['지역', '크루즈', '기타']

const TAG_STYLE: Record<FeedbackTag, string> = {
  '지역':   'bg-blue-50 text-blue-600 border-blue-200',
  '크루즈': 'bg-violet-50 text-violet-600 border-violet-200',
  '기타':   'bg-slate-100 text-slate-500 border-slate-200',
}

const TAG_ACTIVE: Record<FeedbackTag, string> = {
  '지역':   'bg-blue-500 text-white border-blue-500',
  '크루즈': 'bg-violet-500 text-white border-violet-500',
  '기타':   'bg-slate-500 text-white border-slate-500',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const yy  = String(d.getFullYear()).slice(2)
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const dd  = String(d.getDate()).padStart(2, '0')
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}/${mm}/${dd} ${hh}:${min}`
}

export default function FeedbackMasterTab() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // 필터
  const [regionFilter, setRegionFilter] = useState<string>('ALL')
  const [cruiseFilter, setCruiseFilter] = useState('')

  // 지역 관리 패널
  const [regionMgrOpen, setRegionMgrOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null)
  const [editingRegionLabel, setEditingRegionLabel] = useState('')

  // 피드백 인라인 편집
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editTag, setEditTag] = useState<FeedbackTag | null>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = editTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [editText, editingId])

  // 데이터 조회
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['all-feedback'],
    queryFn: fetchAllFeedbackLogs,
  })
  const { data: regions = [] } = useQuery({
    queryKey: ['region-options'],
    queryFn: fetchRegionOptions,
  })

  // 필터 적용
  const filtered = useMemo(() => {
    return feedbacks.filter(r => {
      if (regionFilter !== 'ALL' && r.voyages?.region !== regionFilter) return false
      if (cruiseFilter.trim() && !r.voyages?.ship_name?.toLowerCase().includes(cruiseFilter.trim().toLowerCase())) return false
      return true
    })
  }, [feedbacks, regionFilter, cruiseFilter])

  // 지역 옵션 뮤테이션
  const addRegionMut = useMutation({
    mutationFn: () => addRegionOption(newLabel.trim()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['region-options'] }); setNewLabel('') },
    onError: () => toast.error('추가에 실패했습니다'),
  })
  const updateRegionMut = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => updateRegionOption(id, label),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['region-options'] }); setEditingRegionId(null) },
    onError: () => toast.error('수정에 실패했습니다'),
  })
  const deleteRegionMut = useMutation({
    mutationFn: (id: string) => deleteRegionOption(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['region-options'] })
      if (regionFilter === regions.find(r => r.id === id)?.label) setRegionFilter('ALL')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  // 피드백 뮤테이션
  const updateMut = useMutation({
    mutationFn: ({ id, content, tag }: { id: string; content: string; tag: FeedbackTag | null }) =>
      updateFeedbackLog(id, content, tag),
    onSuccess: () => {
      setEditingId(null)
      qc.invalidateQueries({ queryKey: ['all-feedback'] })
      toast.success('수정됐습니다')
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFeedbackLog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-feedback'] }),
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  function startEdit(r: FeedbackRow) { setEditingId(r.id); setEditText(r.content); setEditTag(r.tag) }
  function cancelEdit() { setEditingId(null); setEditText(''); setEditTag(null) }
  function saveEdit(id: string) {
    if (!editText.trim()) return
    updateMut.mutate({ id, content: editText.trim(), tag: editTag })
  }
  function handleDelete(r: FeedbackRow) {
    deleteMut.mutate(r.id)
    toast.success('삭제되었습니다')
  }

  return (
    <div className="space-y-4">

      {/* ── 헤더: 제목 + 필터 한 줄 ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">피드백</h1>
          <p className="text-sm text-slate-400">전체 {feedbacks.length}건 · 필터 {filtered.length}건</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 지역별 드롭다운 */}
          <FieldSelect
            value={regionFilter}
            options={[
              { value: 'ALL', label: '전체 지역' },
              ...regions.map(r => ({ value: r.label, label: r.label })),
            ]}
            onChange={setRegionFilter}
            className="w-36"
          />

          {/* 지역 관리 토글 버튼 */}
          <button
            type="button"
            onClick={() => setRegionMgrOpen(v => !v)}
            title="지역 관리"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              regionMgrOpen
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-slate-200 bg-white text-slate-400 hover:border-brand/50 hover:text-brand'
            }`}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* 크루즈 검색 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={cruiseFilter}
              onChange={e => setCruiseFilter(e.target.value)}
              placeholder="크루즈명 검색"
              className="h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-lg w-44 bg-white transition hover:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* ── 지역 관리 패널 (토글) ── */}
      {regionMgrOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">지역 관리</p>
          <div className="flex flex-wrap gap-2 items-center">
            {regions.map(r => (
              <div key={r.id} className="flex items-center gap-1 group/item">
                {editingRegionId === r.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={editingRegionLabel}
                      onChange={e => setEditingRegionLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editingRegionLabel.trim()) updateRegionMut.mutate({ id: r.id, label: editingRegionLabel.trim() })
                        if (e.key === 'Escape') setEditingRegionId(null)
                      }}
                      autoFocus
                      className="text-xs border border-brand rounded px-2 py-1 w-28 focus:outline-none"
                    />
                    <button onClick={() => { if (editingRegionLabel.trim()) updateRegionMut.mutate({ id: r.id, label: editingRegionLabel.trim() }) }} className="p-1 rounded text-brand hover:bg-brand/10 transition"><Check className="h-3 w-3" /></button>
                    <button onClick={() => setEditingRegionId(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100 transition"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="text-xs text-slate-700">{r.label}</span>
                    <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingRegionId(r.id); setEditingRegionLabel(r.label) }} className="p-0.5 rounded text-slate-400 hover:text-slate-600 transition"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => deleteRegionMut.mutate(r.id)} className="p-0.5 rounded text-slate-400 hover:text-red-500 transition"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* 새 지역 추가 */}
            <div className="flex items-center gap-1">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) addRegionMut.mutate() }}
                placeholder="새 지역"
                className="text-xs border border-slate-200 rounded-full px-3 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                onClick={() => { if (newLabel.trim()) addRegionMut.mutate() }}
                disabled={!newLabel.trim() || addRegionMut.isPending}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark disabled:opacity-40 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 피드백 피드 ── */}
      <div className="space-y-2">
        {isLoading && (
          <div className="py-16 text-center text-sm text-slate-400">불러오는 중…</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">피드백이 없습니다</div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* 행사명 + 수정/삭제 */}
            <div className="flex items-center justify-between gap-2 mb-2">
              {r.voyages ? (
                <button
                  onClick={() => navigate(`/voyages?tab=항차검색&voyage=${r.voyage_id}`)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand transition"
                >
                  {voyageTitle(r.voyages)}
                  {r.voyages.ship_name && (
                    <span className="text-slate-400 font-normal">· {r.voyages.ship_name}</span>
                  )}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                </button>
              ) : (
                <span className="text-xs text-slate-400">행사 없음</span>
              )}
              {editingId !== r.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(r)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" aria-label="수정"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(r)} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition" aria-label="삭제"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>

            {/* 태그 + 내용 / 수정 폼 */}
            {editingId === r.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditTag(prev => prev === tag ? null : tag)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded border transition ${editTag === tag ? TAG_ACTIVE[tag] : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={editTextareaRef}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(r.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  rows={2}
                  autoFocus
                  className="w-full resize-none rounded-lg border border-brand px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  style={{ minHeight: '4rem' }}
                />
                <div className="flex items-center gap-1.5">
                  <button onClick={() => saveEdit(r.id)} disabled={!editText.trim() || updateMut.isPending} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-dark disabled:opacity-40 transition"><Check className="h-3 w-3" />저장</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-500 text-xs font-medium hover:bg-slate-100 transition"><X className="h-3 w-3" />취소</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 mb-2">
                {r.tag && (
                  <span className={`shrink-0 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${TAG_STYLE[r.tag]}`}>
                    {r.tag}
                  </span>
                )}
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed flex-1">{r.content}</p>
              </div>
            )}

            {/* 작성자 · 시간 */}
            {editingId !== r.id && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-medium text-slate-500">{r.author ?? '알 수 없음'}</span>
                <span>·</span>
                <span>{formatDateTime(r.logged_at)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
