import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, X, Save, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  fetchItineraryPresets, createItineraryPreset,
  updateItineraryPreset, deleteItineraryPreset,
} from '@/lib/queries/itineraryPresets'
import type { ItineraryPreset, PresetPort } from '@/lib/queries/itineraryPresets'
import { TimePicker } from '@/components/ui/time-picker'

const EMPTY_PORT: PresetPort = { port: '', arrival_time: '', departure_time: '', summary: '' }

type PortWithKey = PresetPort & { _key: string }

let _kc = 0
const mkKey = () => `k${++_kc}`

/* ─── 기항지 행 (정렬 가능) ─── */
function SortablePortRow({
  portKey, port, onChange, onRemove,
}: {
  portKey: string
  port: PresetPort
  onChange: (p: PresetPort) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: portKey })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      className="flex items-center gap-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripVertical className="h-4 w-4 text-slate-300 hover:text-slate-500" />
      </div>
      <input
        value={port.port}
        onChange={e => onChange({ ...port, port: e.target.value })}
        placeholder="기항지명"
        className="flex-1 min-w-0 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
      <TimePicker value={port.arrival_time} onChange={v => onChange({ ...port, arrival_time: v })} size="sm" className="w-[86px] shrink-0" />
      <TimePicker value={port.departure_time} onChange={v => onChange({ ...port, departure_time: v })} size="sm" className="w-[86px] shrink-0" />
      <input
        value={port.summary}
        onChange={e => onChange({ ...port, summary: e.target.value })}
        placeholder="비고"
        className="w-28 shrink-0 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
      <button type="button" onClick={onRemove} className="shrink-0 text-slate-300 hover:text-red-500 transition">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ─── 루트 아이템 (정렬 가능 + 내부 기항지 정렬) ─── */
function SortablePresetItem({ preset, onSaved }: { preset: ItineraryPreset; onSaved: () => void }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(preset.label)
  const [nights, setNights] = useState(String(preset.nights ?? ''))
  const [ports, setPorts] = useState<PortWithKey[]>(preset.ports.map(p => ({ ...p, _key: mkKey() })))
  const [dirty, setDirty] = useState(false)

  const portSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: preset.id })

  const updateMut = useMutation({
    mutationFn: () => updateItineraryPreset(preset.id, {
      label, nights: nights ? Number(nights) : null,
      ports: ports.map(({ _key: _k, ...rest }) => rest),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itinerary-presets'] })
      setDirty(false)
      toast.success('저장됐습니다')
      onSaved()
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteItineraryPreset(preset.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['itinerary-presets'] }); toast.success('삭제되었습니다') },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  function updatePort(key: string, p: PresetPort) {
    setPorts(prev => prev.map(r => r._key === key ? { ...p, _key: r._key } : r))
    setDirty(true)
  }
  function removePort(key: string) { setPorts(prev => prev.filter(r => r._key !== key)); setDirty(true) }
  function addPort() { setPorts(prev => [...prev, { ...EMPTY_PORT, _key: mkKey() }]); setDirty(true) }

  function handlePortDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oi = ports.findIndex(p => p._key === active.id)
    const ni = ports.findIndex(p => p._key === over.id)
    if (oi === -1 || ni === -1) return
    setPorts(prev => arrayMove(prev, oi, ni))
    setDirty(true)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      className="rounded-lg border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <GripVertical className="h-4 w-4 text-slate-300 hover:text-slate-500" />
        </div>
        <button type="button" onClick={() => setOpen(v => !v)} className="shrink-0 text-slate-400 hover:text-slate-600 transition">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <input
          value={label}
          onChange={e => { setLabel(e.target.value); setDirty(true) }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-brand"
          placeholder="루트 이름"
        />
        <input
          value={nights}
          onChange={e => { setNights(e.target.value); setDirty(true) }}
          type="number" min={1} placeholder="박"
          className="w-14 shrink-0 rounded border border-slate-200 px-2 py-0.5 text-xs text-center outline-none focus:border-brand"
        />
        <span className="text-xs text-slate-400 shrink-0">박</span>
        {dirty && (
          <button
            type="button" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
            className="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
          >
            <Save className="h-3 w-3" />{updateMut.isPending ? '저장 중…' : '저장'}
          </button>
        )}
        <button
          type="button"
          onClick={() => { if (confirm(`'${label}' 루트를 삭제할까요?`)) deleteMut.mutate() }}
          disabled={deleteMut.isPending}
          className="shrink-0 text-slate-300 hover:text-red-500 transition disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase pl-6 pr-4">
            <span className="flex-1 min-w-0">기항지</span>
            <span className="w-[86px] shrink-0 text-center">도착</span>
            <span className="w-[86px] shrink-0 text-center">출발</span>
            <span className="w-28 shrink-0">비고</span>
            <span className="w-3.5 shrink-0" />
          </div>
          {ports.length === 0 && <p className="text-xs text-slate-400 text-center py-2">기항지를 추가하세요</p>}
          <DndContext sensors={portSensors} collisionDetection={closestCenter} onDragEnd={handlePortDragEnd}>
            <SortableContext items={ports.map(p => p._key)} strategy={verticalListSortingStrategy}>
              {ports.map(p => (
                <SortablePortRow
                  key={p._key}
                  portKey={p._key}
                  port={p}
                  onChange={updated => updatePort(p._key, updated)}
                  onRemove={() => removePort(p._key)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button type="button" onClick={addPort} className="flex items-center gap-1 text-xs text-brand hover:underline mt-1">
            <Plus className="h-3 w-3" /> 기항지 추가
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── 루트 관리 모달 ─── */
type Props = { onClose: () => void }

export default function ItineraryPresetManager({ onClose }: Props) {
  const qc = useQueryClient()
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['itinerary-presets'],
    queryFn: fetchItineraryPresets,
  })

  const [sorted, setSorted] = useState<ItineraryPreset[]>([])
  useEffect(() => { setSorted(presets) }, [presets])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const createMut = useMutation({
    mutationFn: () => createItineraryPreset({
      label: '새 루트', nights: null, ports: [],
      sort_order: (presets[presets.length - 1]?.sort_order ?? 0) + 1,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['itinerary-presets'] }); toast.success('새 루트가 추가됐습니다') },
    onError: () => toast.error('추가에 실패했습니다'),
  })

  function handlePresetDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oi = sorted.findIndex(p => p.id === active.id)
    const ni = sorted.findIndex(p => p.id === over.id)
    if (oi === -1 || ni === -1) return
    const reordered = arrayMove(sorted, oi, ni)
    setSorted(reordered)
    reordered.forEach((p, i) => {
      if (p.sort_order !== i) updateItineraryPreset(p.id, { sort_order: i })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">루트 관리</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {isLoading && <p className="text-center text-sm text-slate-400 py-8">불러오는 중…</p>}
          {!isLoading && sorted.length === 0 && <p className="text-center text-sm text-slate-400 py-8">등록된 루트가 없습니다</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePresetDragEnd}>
            <SortableContext items={sorted.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {sorted.map(p => (
                <SortablePresetItem key={p.id} preset={p} onSaved={() => {}} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <button
            type="button" onClick={() => createMut.mutate()} disabled={createMut.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand border border-brand/30 hover:bg-brand/5 transition disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {createMut.isPending ? '추가 중…' : '새 루트 추가'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100 transition">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
