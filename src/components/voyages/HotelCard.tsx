import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { DatePicker } from '@/components/ui/date-picker'
import { addHotel, updateHotel, deleteHotel } from '@/lib/queries/voyages'
import { formatDate } from '@/lib/utils'
import type { Hotel } from '@/types/database'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
const SYM: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', SGD: 'S$', JPY: '¥' }

function formatPrice(rate: number | null, currency: string): string {
  if (rate == null) return '—'
  const prefix = SYM[currency] ?? (currency + ' ')
  return prefix + rate.toLocaleString(currency === 'KRW' ? 'ko-KR' : 'en-US')
}

type DraftHotel = {
  _key: string
  id: string
  _isNew?: true
  hotel_name: string
  stay_date: string
  room_rate: number | null
  currency: string
  sort_order: number
}

function toDraft(h: Hotel): DraftHotel {
  return {
    _key: h.id, id: h.id,
    hotel_name: h.hotel_name, stay_date: h.stay_date,
    room_rate: h.room_rate, currency: h.currency, sort_order: h.sort_order,
  }
}

let _keySeq = 1
function newKey() { return `new-${_keySeq++}` }

export default function HotelCard({
  hotels,
  voyageId,
  canWrite = true,
}: {
  hotels: Hotel[]
  voyageId: string
  canWrite?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<DraftHotel[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const qc = useQueryClient()

  function startEdit() {
    setDrafts(hotels.map(toDraft))
    setDeletedIds([])
    setEditing(true)
  }

  function upd(key: string, patch: Partial<DraftHotel>) {
    setDrafts(prev => prev.map(d => d._key === key ? { ...d, ...patch } : d))
  }

  function addRow() {
    setDrafts(prev => [...prev, {
      _key: newKey(), id: '', _isNew: true,
      hotel_name: '', stay_date: '', room_rate: null,
      currency: 'USD', sort_order: prev.length,
    }])
  }

  function removeRow(key: string) {
    const found = drafts.find(d => d._key === key)
    if (found?.id) setDeletedIds(prev => [...prev, found.id])
    setDrafts(prev => prev.filter(d => d._key !== key))
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      await Promise.all([
        ...deletedIds.map(id => deleteHotel(id)),
        ...drafts.filter(d => d._isNew).map((d, i) => addHotel(voyageId, {
          hotel_name: d.hotel_name,
          stay_date:  d.stay_date,
          room_rate:  d.room_rate,
          currency:   d.currency,
          sort_order: i,
        })),
        ...drafts.filter(d => !d._isNew).map((d, i) => updateHotel(d.id, {
          hotel_name: d.hotel_name,
          stay_date:  d.stay_date,
          room_rate:  d.room_rate,
          currency:   d.currency,
          sort_order: i,
        })),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotels', voyageId] })
      qc.invalidateQueries({ queryKey: ['all-hotels'] })
      qc.invalidateQueries({ queryKey: ['voyages'] })
      setEditing(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  // ── 편집 모드 ────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>호텔</CardTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />{saveMut.isPending ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saveMut.isPending}
              className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />취소
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {drafts.map(d => (
            <div key={d._key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1">
                <p className="text-[10px] text-slate-400 mb-0.5">호텔명</p>
                <Input value={d.hotel_name} onChange={e => upd(d._key, { hotel_name: e.target.value })}
                  placeholder="호텔명" className="h-8 text-sm" />
              </div>
              <div className="w-32">
                <p className="text-[10px] text-slate-400 mb-0.5">투숙일</p>
                <DatePicker size="sm" value={d.stay_date} onChange={v => upd(d._key, { stay_date: v })} placeholder="투숙일" />
              </div>
              <div className="w-20">
                <p className="text-[10px] text-slate-400 mb-0.5">통화</p>
                <FieldSelect value={d.currency} options={CURRENCIES}
                  onChange={v => upd(d._key, { currency: v })} className="h-8 text-sm" />
              </div>
              <div className="w-28">
                <p className="text-[10px] text-slate-400 mb-0.5">요금</p>
                <Input type="number" min={0} value={d.room_rate ?? ''}
                  onChange={e => upd(d._key, { room_rate: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="0" className="h-8 text-sm text-right" />
              </div>
              <button type="button" onClick={() => removeRow(d._key)}
                className="self-end p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addRow}
            className="flex items-center gap-1 text-xs text-brand font-medium hover:underline transition">
            <Plus className="h-3.5 w-3.5" />호텔 추가
          </button>
        </CardContent>
      </Card>
    )
  }

  // ── 보기 모드 ────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle>호텔</CardTitle>
        {canWrite && (
          <button
            onClick={startEdit}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="편집"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {hotels.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">등록된 호텔이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {hotels.map(h => (
              <div key={h.id} className="rounded-lg border border-slate-100 p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{h.hotel_name}</span>
                  <span className="text-xs text-slate-400">{formatDate(h.stay_date)}</span>
                </div>
                <span className="text-sm font-semibold text-brand">{formatPrice(h.room_rate, h.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
