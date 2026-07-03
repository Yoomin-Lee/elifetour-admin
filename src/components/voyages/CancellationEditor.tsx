import { useState, useRef } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, FileText, Settings, GripVertical } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FieldSelect } from '@/components/ui/field-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { useClickOutside } from '@/hooks/useClickOutside'
import { fetchCancellationPresets } from '@/lib/queries/cancellationPresets'
import type { CancellationPresetDB } from '@/lib/queries/cancellationPresets'
import { fetchMnSections } from '@/lib/queries/mnSections'
import type { MnSection } from '@/lib/queries/mnSections'
import { fetchAirlineOptions } from '@/lib/queries/airlineOptions'
import { SelectOrInput } from '@/components/ui/select-or-input'
import CancellationPresetManager from './CancellationPresetManager'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const CATEGORIES = ['크루즈', '항공', '호텔']
const AGENTS = ['TMK', 'COSTA', 'ONLINE', 'DONGBO', 'VASCO', 'FLORENCE']
const stripParens = (v: string) => v.replace(/\s*\(.*\)\s*$/, '')
const LEGACY_CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'JPY']
const cleanFeeUnit = (v: string | undefined | null) =>
  LEGACY_CURRENCIES.includes(v ?? '') ? '' : (v ?? '')

function SortablePolicyRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      className="flex gap-2 items-start rounded-lg border border-slate-100 p-2"
    >
      <div {...attributes} {...listeners} className="mt-2 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripVertical className="h-4 w-4 text-slate-300 hover:text-slate-500" />
      </div>
      {children}
    </div>
  )
}

const EMPTY_POLICY = {
  category: '', start_d_minus: undefined, end_d_minus: undefined,
  reference_date: '', fee_description: '', fee_type: undefined, fee_value: undefined,
  fee_unit: '', note: '', sort_order: 0,
}

export default function CancellationEditor() {
  const { register, watch, setValue } = useFormContext<VoyageFormValues>()
  const watchedPolicies = watch('policies')
  const { fields, append, remove, replace, move } = useFieldArray<VoyageFormValues, 'policies'>({ name: 'policies' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handlePolicyDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = fields.findIndex(f => f.id === active.id)
    const newIdx = fields.findIndex(f => f.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx)
  }
  const [presetOpen, setPresetOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<CancellationPresetDB | null>(null)
  const [pendingMn, setPendingMn] = useState<MnSection | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const presetBtnRef = useRef<HTMLDivElement>(null)
  useClickOutside(presetBtnRef, presetOpen, () => setPresetOpen(false))

  const { data: presets = [] } = useQuery({
    queryKey: ['cancellation-presets'],
    queryFn: fetchCancellationPresets,
  })

  const { data: mnSections = [] } = useQuery({
    queryKey: ['mn-sections'],
    queryFn: fetchMnSections,
    select: (data) => data.filter(s => s.category === '취소료'),
  })

  const { data: airlineOptions = [] } = useQuery({
    queryKey: ['airline-options'],
    queryFn: fetchAirlineOptions,
    select: data => data.map(r => r.label),
  })

  function mnSectionToPolicies(section: MnSection) {
    return section.rows
      .filter(r => r.d || r.fee)
      .map((r, i) => ({
        category: '크루즈' as const,
        fee_description: r.d ?? '',
        note: [r.fee, r.note].filter(Boolean).join(' | '),
        start_d_minus: undefined,
        end_d_minus: undefined,
        reference_date: '',
        fee_type: undefined as 'percent' | 'fixed' | 'free' | undefined,
        fee_value: undefined,
        fee_unit: '',
        sort_order: i,
      }))
  }

  function applyMnSection(section: MnSection, mode: 'replace' | 'append') {
    const rows = mnSectionToPolicies(section)
    if (mode === 'replace') replace(rows as any)
    else rows.forEach(r => append(r as any))
    setImportMsg(`${section.title} — ${rows.length}개 구간 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingPreset(null)
    setPresetOpen(false)
  }

  function handleMnSelect(section: MnSection) {
    if (fields.length > 0) {
      setPendingMn(section)
      setPresetOpen(false)
    } else {
      applyMnSection(section, 'replace')
    }
  }

  function applyPreset(preset: CancellationPresetDB, mode: 'replace' | 'append') {
    const policies = preset.policies.map(p => ({ ...p, fee_unit: cleanFeeUnit(p.fee_unit) }))
    if (mode === 'replace') {
      replace(policies as any)
    } else {
      policies.forEach(p => append(p as any))
    }
    setImportMsg(`${preset.label} — ${preset.policies.length}개 구간 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingPreset(null)
    setPresetOpen(false)
  }

  function handlePresetSelect(preset: CancellationPresetDB) {
    if (fields.length > 0) {
      setPendingPreset(preset)
      setPresetOpen(false)
    } else {
      applyPreset(preset, 'replace')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>취소료</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {importMsg && (
              <span className="text-xs text-brand font-medium">{importMsg}</span>
            )}

            {/* 프리셋 드롭다운 */}
            <div className="relative" ref={presetBtnRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!presetOpen && presetBtnRef.current) {
                    const rect = presetBtnRef.current.getBoundingClientRect()
                    setDropUp(window.innerHeight - rect.bottom < 280)
                  }
                  setPresetOpen(v => !v)
                }}
                className="gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                취소료 불러오기
                <ChevronDown className={`h-3 w-3 transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
              </Button>
              {presetOpen && (
                  <div className={`absolute left-0 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden flex flex-col ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    <div className="overflow-y-auto max-h-64 scrollbar-navy">
                      {mnSections.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">취소료 규정</p>
                          {mnSections.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleMnSelect(s)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-brand/5 transition"
                            >
                              <span className="font-medium text-slate-700">{s.title}</span>
                              <span className="ml-1.5 text-slate-400">{s.rows.length}구간</span>
                            </button>
                          ))}
                        </>
                      )}
                      {presets.length > 0 && (
                        <>
                          {mnSections.length > 0 && <div className="my-1 border-t border-slate-100" />}
                          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">저장된 프리셋</p>
                          {presets.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handlePresetSelect(p)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition"
                            >
                              <span className="font-medium text-slate-700">{p.label}</span>
                              <span className="ml-1.5 text-slate-400">{p.policies.length}구간</span>
                            </button>
                          ))}
                        </>
                      )}
                      {mnSections.length === 0 && presets.length === 0 && (
                        <p className="px-3 py-2 text-xs text-slate-400">등록된 취소료가 없습니다</p>
                      )}
                    </div>
                    <div className="border-t border-slate-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setPresetOpen(false); setManagerOpen(true) }}
                        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition"
                      >
                        <Settings className="h-3 w-3" /> 취소료 관리
                      </button>
                    </div>
                  </div>
              )}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_POLICY)}>
              <Plus className="h-4 w-4" /> 구간 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* 프리셋 적용 확인 */}
          {(pendingPreset || pendingMn) && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800 font-medium mb-2">
                이미 입력된 취소료가 있습니다. 어떻게 처리할까요?
              </p>
              <p className="text-xs text-amber-600 mb-3">
                선택한 취소료: <span className="font-semibold">{pendingPreset ? pendingPreset.label : pendingMn!.title}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => pendingPreset ? applyPreset(pendingPreset, 'replace') : applyMnSection(pendingMn!, 'replace')}
                  className="rounded px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition"
                >
                  기존 삭제 후 불러오기
                </button>
                <button
                  type="button"
                  onClick={() => pendingPreset ? applyPreset(pendingPreset, 'append') : applyMnSection(pendingMn!, 'append')}
                  className="rounded px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                >
                  기존 유지하고 추가
                </button>
                <button
                  type="button"
                  onClick={() => { setPendingPreset(null); setPendingMn(null) }}
                  className="rounded px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 transition"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {fields.length === 0 && !pendingPreset && !pendingMn && (
            <p className="py-4 text-center text-sm text-slate-400">취소료 불러오기 또는 구간을 직접 추가하세요</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePolicyDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {fields.map((field, i) => (
              <SortablePolicyRow key={field.id} id={field.id}>
                <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="label">구분</label>
                    <FieldSelect
                      value={watchedPolicies?.[i]?.category ?? ''}
                      options={CATEGORIES}
                      onChange={v => {
                        setValue(`policies.${i}.category`, v)
                        setValue(`policies.${i}.fee_unit`, '')
                      }}
                      placeholder="-"
                    />
                  </div>
                  <div>
                    {watchedPolicies?.[i]?.category === '크루즈' && (
                      <>
                        <label className="label">에이전트</label>
                        <FieldSelect
                          value={watchedPolicies[i].fee_unit ?? ''}
                          options={AGENTS}
                          onChange={v => setValue(`policies.${i}.fee_unit`, v)}
                          placeholder="-"
                        />
                      </>
                    )}
                    {watchedPolicies?.[i]?.category === '항공' && (
                      <>
                        <label className="label">항공사</label>
                        <SelectOrInput
                          value={watchedPolicies[i].fee_unit ?? ''}
                          options={airlineOptions}
                          onChange={v => setValue(`policies.${i}.fee_unit`, stripParens(v))}
                          placeholder="항공사 선택"
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <label className="label">시작 D-</label>
                    <Input
                      type="number"
                      {...register(`policies.${i}.start_d_minus`)}
                      placeholder="없음이면 빈칸"
                    />
                  </div>
                  <div>
                    <label className="label">종료 D-</label>
                    <Input type="number" {...register(`policies.${i}.end_d_minus`)} placeholder="예: 90" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">기준일 <span className="text-slate-400 font-normal text-[10px]">(비워두면 자동)</span></label>
                    <DatePicker
                      value={watchedPolicies?.[i]?.reference_date ?? ''}
                      onChange={v => setValue(`policies.${i}.reference_date`, v)}
                      placeholder="기준일 선택"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">취소료 설명</label>
                    <Input {...register(`policies.${i}.fee_description`)} placeholder="예: 크루즈요금 25%" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </SortablePolicyRow>
            ))}
          </div>
          </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {managerOpen && (
        <CancellationPresetManager onClose={() => setManagerOpen(false)} />
      )}
    </>
  )
}
