'use client'
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { addHistoryLog } from '@/lib/queries/voyages'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => addHistoryLog(voyageId, text.trim(), author),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['history', voyageId] })
    },
  })

  const submit = () => {
    if (!text.trim()) return
    mutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>히스토리</CardTitle>
        <span className="text-xs text-slate-400">{logs.length}건</span>
      </CardHeader>
      <CardContent className="p-0">
        {/* 메모 입력 (staff/admin만) */}
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
                disabled={!text.trim() || mutation.isPending}
                className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {mutation.isError && (
              <p className="mt-1 text-xs text-red-500">저장에 실패했습니다</p>
            )}
          </div>
        )}

        {/* 로그 목록 */}
        <ul className="divide-y divide-slate-50">
          {logs.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-400">히스토리가 없습니다</li>
          ) : (
            logs.map(log => (
              <li key={log.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-600">{log.author ?? '알 수 없음'}</span>
                  <span className="text-xs text-slate-400">{timeAgo(log.logged_at)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{log.content}</p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
