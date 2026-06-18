'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Pencil, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { addHistoryLog, updateHistoryLog, deleteHistoryLog } from '@/lib/queries/voyages'
import type { HistoryLog } from '@/types/database'

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

export default function HistoryCard({
  logs,
  voyageId,
  author,
  canWrite = true,
}: {
  logs: HistoryLog[]
  voyageId: string
  author: string
  canWrite?: boolean
}) {
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  const addMutation = useMutation({
    mutationFn: () => addHistoryLog(voyageId, text.trim(), author),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['history', voyageId] })
      toast.success('메모가 저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateHistoryLog(id, content),
    onSuccess: () => {
      setEditingId(null)
      setEditText('')
      qc.invalidateQueries({ queryKey: ['history', voyageId] })
      toast.success('수정됐습니다')
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHistoryLog(id),
    onError: () => {
      qc.invalidateQueries({ queryKey: ['history', voyageId] })
      toast.error('삭제에 실패했습니다')
    },
  })

  const submit = () => {
    if (!text.trim()) return
    addMutation.mutate()
  }

  function startEdit(log: HistoryLog) {
    setEditingId(log.id)
    setEditText(log.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  function saveEdit(id: string) {
    if (!editText.trim()) return
    updateMutation.mutate({ id, content: editText.trim() })
  }

  function handleDelete(log: HistoryLog) {
    qc.setQueryData<HistoryLog[]>(['history', voyageId], prev =>
      (prev ?? []).filter(l => l.id !== log.id)
    )
    deleteMutation.mutate(log.id)
    toast('히스토리가 삭제됐습니다.', {
      position: 'bottom-center',
      duration: 3500,
      action: {
        label: '복원',
        onClick: () => {
          addHistoryLog(voyageId, log.content, log.author ?? author)
            .then(() => qc.invalidateQueries({ queryKey: ['history', voyageId] }))
            .catch(() => toast.error('복원에 실패했습니다'))
        },
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>히스토리</CardTitle>
        <span className="text-xs text-slate-400">{logs.length}건</span>
      </CardHeader>
      <CardContent className="p-0">
        {canWrite && (
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
                placeholder="메모 추가… (Ctrl+Enter로 저장)"
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
            <li className="py-8 text-center text-sm text-slate-400">히스토리가 없습니다</li>
          ) : (
            logs.map(log => (
              <li key={log.id} className="group px-5 py-3">
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
                {editingId === log.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(log.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      rows={3}
                      autoFocus
                      className="w-full resize-none rounded-lg border border-brand px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
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
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{log.content}</p>
                )}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
