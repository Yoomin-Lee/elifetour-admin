import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { saveItineraryDay, deleteItineraryDay } from '@/lib/queries/voyages'
import type { ItineraryDay } from '@/types/database'

const SEA_DAY = '해상'

type DraftDay = {
  _key: string
  _isNew: boolean
  _deleted: boolean
  id: string
  date: string
  port: string
  arrival_time: string
  departure_time: string
  summary: string
  category: string
  cost: string
  cost_currency: string
  sort_order: number
}

function toDraft(d: ItineraryDay): DraftDay {
  return {
    _key: d.id, _isNew: false, _deleted: false, id: d.id,
    date: d.date, port: d.port,
    arrival_time: d.arrival_time ?? '', departure_time: d.departure_time ?? '',
    summary: d.summary ?? '', category: d.category ?? '',
    cost: d.cost != null ? String(d.cost) : '',
    cost_currency: d.cost_currency ?? '',
    sort_order: d.sort_order,
  }
}

const EMPTY: Omit<DraftDay, '_key'> = {
  _isNew: true, _deleted: false, id: '',
  date: '', port: '', arrival_time: '', departure_time: '',
  summary: '', category: '', cost: '', cost_currency: '', sort_order: 0,
}

function toInput(r: DraftDay, idx: number) {
  return {
    date: r.date,
    port: r.port,
    arrival_time: r.arrival_time || null,
    departure_time: r.departure_time || null,
    summary: r.summary || null,
    category: r.category || null,
    cost: r.cost ? Number(r.cost) : null,
    cost_currency: r.cost_currency || null,
    sort_order: r.sort_order || idx + 1,
  }
}

export default function ItineraryCard({
  days,
  voyageId,
}: {
  days: ItineraryDay[]
  voyageId: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftDay[]>([])
  const qc = useQueryClient()

  const saveMut = useMutation({
    mutationFn: async () => {
      let idx = 0
      await Promise.all(draft.map(r => {
        if (r._deleted && !r._isNew) return deleteItineraryDay(r.id)
        if (r._isNew && !r._deleted) return saveItineraryDay(voyageId, toInput(r, idx++))
        if (!r._isNew && !r._deleted) return saveItineraryDay(voyageId, toInput(r, idx++), r.id)
        return Promise.resolve()
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itinerary', voyageId] })
      setEditing(false)
      setDraft([])
    },
  })

  function startEdit() {
    setDraft(days.map(toDraft))
    setEditing(true)
  }

  function addRow() {
    setDraft(d => [...d, { ...EMPTY, _key: `new-${Date.now()}` }])
  }

  function removeRow(key: string) {
    setDraft(d =>
      d.map(r => r._key === key
        ? (r._isNew ? null : { ...r, _deleted: true })
        : r
      ).filter((r): r is DraftDay => r !== null)
    )
  }

  function upd(key: string, field: keyof DraftDay, value: string) {
    setDraft(d => d.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  const visible = draft.filter(r => !r._deleted)

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>기항지 일정</CardTitle>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={saveMut.isPending}>
              <Plus className="h-3.5 w-3.5" /> 행 추가
            </Button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft([]) }}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {saveMut.isError && (
            <p className="mb-2 text-xs text-red-500">저장에 실패했습니다. 다시 시도하세요.</p>
          )}
          <div className="space-y-2">
            {visible.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">행 추가를 눌러 기항지를 등록하세요</p>
            ) : (
              visible.map((r, i) => (
                <div key={r._key} className="relative flex gap-2 items-start rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
                    <div>
                      <label className="label">날짜</label>
                      <Input type="date" value={r.date} onChange={e => upd(r._key, 'date', e.target.value)} className="h-7 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">기항지</label>
                      <Input value={r.port} onChange={e => upd(r._key, 'port', e.target.value)} placeholder="바르셀로나 (스페인)" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">도착</label>
                      <Input type="time" value={r.arrival_time} onChange={e => upd(r._key, 'arrival_time', e.target.value)} className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">출발</label>
                      <Input type="time" value={r.departure_time} onChange={e => upd(r._key, 'departure_time', e.target.value)} className="h-7 text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-5">
                      <label className="label">비고</label>
                      <Input value={r.summary} onChange={e => upd(r._key, 'summary', e.target.value)} placeholder="주요 관광지, 이동 정보 등" className="h-7 text-sm" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(r._key)}
                    className="mt-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기항지 일정</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{days.length}일</span>
          <button
            onClick={startEdit}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="편집"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {days.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 일정이 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>기항지</TableHead>
                <TableHead>도착</TableHead>
                <TableHead>출발</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d, i) => {
                const isSea = d.port.includes(SEA_DAY)
                return (
                  <TableRow
                    key={d.id}
                    className={isSea ? 'bg-slate-50/80 text-slate-400' : ''}
                  >
                    <TableCell className="text-slate-400 text-xs">{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{formatDate(d.date)}</TableCell>
                    <TableCell className={isSea ? 'italic' : 'font-medium'}>{d.port}</TableCell>
                    <TableCell>{formatTime(d.arrival_time)}</TableCell>
                    <TableCell>{formatTime(d.departure_time)}</TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-48 truncate">{d.summary ?? ''}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
