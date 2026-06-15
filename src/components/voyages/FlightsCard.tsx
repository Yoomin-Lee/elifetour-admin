import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { saveFlight, deleteFlightRow } from '@/lib/queries/voyages'
import type { Flight } from '@/types/database'

type DraftFlight = {
  _key: string
  _isNew: boolean
  _deleted: boolean
  id: string
  flight_no: string
  origin: string
  destination: string
  departure_date: string
  departure_time: string
  arrival_date: string
  arrival_time: string
  duration: string
  fare: string
  sort_order: number
}

function toDraft(f: Flight): DraftFlight {
  return {
    _key: f.id, _isNew: false, _deleted: false, id: f.id,
    flight_no: f.flight_no ?? '', origin: f.origin ?? '', destination: f.destination ?? '',
    departure_date: f.departure_date ?? '', departure_time: f.departure_time ?? '',
    arrival_date: f.arrival_date ?? '', arrival_time: f.arrival_time ?? '',
    duration: f.duration ?? '', fare: f.fare != null ? String(f.fare) : '',
    sort_order: f.sort_order,
  }
}

const EMPTY: Omit<DraftFlight, '_key'> = {
  _isNew: true, _deleted: false, id: '',
  flight_no: '', origin: '', destination: '',
  departure_date: '', departure_time: '',
  arrival_date: '', arrival_time: '',
  duration: '', fare: '', sort_order: 0,
}

function toInput(r: DraftFlight, voyageId: string, idx: number) {
  return {
    flight_no: r.flight_no || null,
    origin: r.origin || null,
    destination: r.destination || null,
    departure_date: r.departure_date || null,
    departure_time: r.departure_time || null,
    arrival_date: r.arrival_date || null,
    arrival_time: r.arrival_time || null,
    duration: r.duration || null,
    fare: r.fare ? Number(r.fare) : null,
    sort_order: r.sort_order || idx + 1,
  }
}

export default function FlightsCard({
  flights,
  voyageId,
  canWrite = true,
}: {
  flights: Flight[]
  voyageId: string
  canWrite?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftFlight[]>([])
  const qc = useQueryClient()

  const saveMut = useMutation({
    mutationFn: async () => {
      let idx = 0
      await Promise.all(draft.map(r => {
        if (r._deleted && !r._isNew) return deleteFlightRow(r.id)
        if (r._isNew && !r._deleted) return saveFlight(voyageId, toInput(r, voyageId, idx++))
        if (!r._isNew && !r._deleted) return saveFlight(voyageId, toInput(r, voyageId, idx++), r.id)
        return Promise.resolve()
      }))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flights', voyageId] })
      setEditing(false)
      setDraft([])
    },
  })

  function startEdit() {
    setDraft(flights.map(toDraft))
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
      ).filter((r): r is DraftFlight => r !== null)
    )
  }

  function upd(key: string, field: keyof DraftFlight, value: string) {
    setDraft(d => d.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  const visible = draft.filter(r => !r._deleted)

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>항공</CardTitle>
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
              <p className="py-4 text-center text-sm text-slate-400">행 추가를 눌러 항공편을 등록하세요</p>
            ) : (
              visible.map((r, i) => (
                <div key={r._key} className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <button
                    type="button"
                    onClick={() => removeRow(r._key)}
                    className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="mb-2 block text-xs font-medium text-slate-400">{i + 1}편</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="label">편명</label>
                      <Input value={r.flight_no} onChange={e => upd(r._key, 'flight_no', e.target.value)} placeholder="KE907" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">출발지</label>
                      <Input value={r.origin} onChange={e => upd(r._key, 'origin', e.target.value)} placeholder="인천(ICN)" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">도착지</label>
                      <Input value={r.destination} onChange={e => upd(r._key, 'destination', e.target.value)} placeholder="바르셀로나(BCN)" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">소요 시간</label>
                      <Input value={r.duration} onChange={e => upd(r._key, 'duration', e.target.value)} placeholder="12h 40m" className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">출발일</label>
                      <Input type="date" value={r.departure_date} onChange={e => upd(r._key, 'departure_date', e.target.value)} className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">출발 시간</label>
                      <TimePicker size="sm" value={r.departure_time} onChange={v => upd(r._key, 'departure_time', v)} />
                    </div>
                    <div>
                      <label className="label">도착일</label>
                      <Input type="date" value={r.arrival_date} onChange={e => upd(r._key, 'arrival_date', e.target.value)} className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="label">도착 시간</label>
                      <TimePicker size="sm" value={r.arrival_time} onChange={v => upd(r._key, 'arrival_time', v)} />
                    </div>
                  </div>
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
        <CardTitle>항공</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{flights.length}편</span>
          {canWrite && (
            <button
              onClick={startEdit}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="편집"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {flights.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">등록된 항공편이 없습니다</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>편명</TableHead>
                <TableHead>출발지</TableHead>
                <TableHead>도착지</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>출발</TableHead>
                <TableHead>도착</TableHead>
                <TableHead>소요</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono font-medium text-brand">{f.flight_no ?? '-'}</TableCell>
                  <TableCell>{f.origin ?? '-'}</TableCell>
                  <TableCell>{f.destination ?? '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(f.departure_date)}</TableCell>
                  <TableCell>{formatTime(f.departure_time)}</TableCell>
                  <TableCell>{formatTime(f.arrival_time)}</TableCell>
                  <TableCell className="text-slate-500">{f.duration ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
