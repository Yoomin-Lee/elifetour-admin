'use client'
import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Pencil, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { addFeedbackLog, updateFeedbackLog, deleteFeedbackLog } from '@/lib/queries/voyages'
import type { FeedbackLog, FeedbackTag } from '@/types/database'

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

function TagBadge({ tag }: { tag: FeedbackTag }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TAG_STYLE[tag]}`}>
      {tag}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const hr   = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min  < 1)  return '방금'
  if (min  < 60) return `${min}분 전`
  if (hr   < 24) return `${hr}시간 전`
  if (day  < 7)  return `${day}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function FeedbackCard({
  logs,
  voyageId,
  author,
  canWrite = true,
}: {
  logs: FeedbackLog[]
  voyageId: string
  author: string
  canWrite?: boolean
}) {
  const [text, setText] = useState('')
  const [selectedTag, setSelectedTag] = useState<FeedbackTag | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editTag, setEditTag] = useState<FeedbackTag | null>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    const el = editTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [editText, editingId])

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['feedback', voyageId] })
    qc.invalidateQueries({ queryKey: ['all-feedback'] })
  }

  const addMutation = useMutation({
    mutationFn: () => addFeedbackLog(voyageId, text.trim(), author, selectedTag),
    onSuccess: () => {
      setText('')
      setSelectedTag(null)
      invalidateAll()
      toast.success('피드백이 저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, content, tag }: { id: string; content: string; tag: FeedbackTag | null }) =>
      updateFeedbackLog(id, content, tag),
    onSuccess: () => {
      setEditingId(null)
      setEditText('')
      setEditTag(null)
      invalidateAll()
      toast.success('수정됐습니다')
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedbackLog(id),
    onSuccess: () => invalidateAll(),
    onError: () => {
      invalidateAll()
      toast.error('삭제에 실패했습니다')
    },
  })

  const submit = () => {
    if (!text.trim()) return
    addMutation.mutate()
  }

  function startEdit(log: FeedbackLog) {
    setEditingId(log.id)
    setEditText(log.content)
    setEditTag(log.tag)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
    setEditTag(null)
  }

  function saveEdit(id: string) {
    if (!editText.trim()) return
    updateMutation.mutate({ id, content: editText.trim(), tag: editTag })
  }

  function handleDelete(log: FeedbackLog) {
    qc.setQueryData<FeedbackLog[]>(['feedback', voyageId], prev =>
      (prev ?? []).filter(l => l.id !== log.id)
    )
    deleteMutation.mutate(log.id)
    const restore = () => addFeedbackLog(voyageId, log.content, log.author ?? author, log.tag)
      .then(() => invalidateAll())
      .catch(() => toast.error('복원에 실패했습니다'))
    toast.custom(id => (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-200/60 text-sm min-w-[260px]">
        <span className="text-slate-700 flex-1">피드백이 삭제되었습니다.</span>
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
    <Card>
      <CardHeader>
        <CardTitle>피드백</CardTitle>
        <span className="text-xs text-slate-400">{logs.length}건</span>
      </CardHeader>
      <CardContent className="p-0">
        {canWrite && (
          <div className="px-5 py-3 border-b border-slate-100">
            {/* 태그 선택 */}
            <div className="flex items-center gap-1.5 mb-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                    selectedTag === tag ? TAG_ACTIVE[tag] : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* 입력창 */}
            <div className="flex gap-2 items-end">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
                placeholder="피드백 추가… (Ctrl+Enter로 저장)"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              />
              <button
                onClick={submit}
                disabled={!text.trim() || addMutation.isPending}
                className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {addMutation.isError && (
              <p className="mt-1 text-xs text-red-500">저장에 실패했습니다</p>
            )}
          </div>
        )}

        <ul className="divide-y divide-slate-50">
          {logs.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-400">피드백이 없습니다</li>
          ) : (
            logs.map(log => (
              <li key={log.id} className="group px-5 py-3">
                {/* 작성자 + 시간 */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">{log.author ?? '알 수 없음'}</span>
                    <span className="text-xs text-slate-400">{timeAgo(log.logged_at)}</span>
                  </div>
                  {canWrite && editingId !== log.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(log)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        aria-label="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(log)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 태그 + 내용 */}
                {editingId === log.id ? (
                  <div className="space-y-2">
                    {/* 수정 중 태그 선택 */}
                    <div className="flex items-center gap-1.5">
                      {TAGS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setEditTag(prev => prev === tag ? null : tag)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded border transition ${
                            editTag === tag ? TAG_ACTIVE[tag] : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
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
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(log.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      rows={1}
                      autoFocus
                      className="w-full resize-none rounded-lg border border-brand px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                      style={{ minHeight: '4.5rem' }}
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => saveEdit(log.id)}
                        disabled={!editText.trim() || updateMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand text-white text-xs font-medium transition hover:bg-brand-dark disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" />
                        저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-500 text-xs font-medium hover:bg-slate-100 transition"
                      >
                        <X className="h-3 w-3" />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    {log.tag && <TagBadge tag={log.tag} />}
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed flex-1">{log.content}</p>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
