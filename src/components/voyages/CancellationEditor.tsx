import { useState, useRef } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, FileText, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { fetchCancellationPresets } from '@/lib/queries/cancellationPresets'
import type { CancellationPresetDB } from '@/lib/queries/cancellationPresets'
import CancellationPresetManager from './CancellationPresetManager'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const CURRENCIES = ['KRW', 'USD', 'EUR', 'SGD', 'GBP']

const EMPTY_POLICY = {
  category: '', start_d_minus: undefined, end_d_minus: undefined,
  reference_date: '', fee_description: '', fee_type: undefined, fee_value: undefined,
  fee_unit: '', note: '', sort_order: 0,
}

export default function CancellationEditor() {
  const { register } = useFormContext<VoyageFormValues>()
  const { fields, append, remove, replace } = useFieldArray<VoyageFormValues, 'policies'>({ name: 'policies' })
  const [presetOpen, setPresetOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<CancellationPresetDB | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const presetBtnRef = useRef<HTMLDivElement>(null)

  const { data: presets = [] } = useQuery({
    queryKey: ['cancellation-presets'],
    queryFn: fetchCancellationPresets,
  })

  function applyPreset(preset: CancellationPresetDB, mode: 'replace' | 'append') {
    if (mode === 'replace') {
      replace(preset.policies as any)
    } else {
      preset.policies.forEach(p => append(p as any))
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
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
                  <div className={`absolute left-0 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden flex flex-col ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    <div className="overflow-y-auto max-h-56">
                      {presets.length === 0 && (
                        <p className="px-3 py-2 text-xs text-slate-400">등록된 취소료가 없습니다</p>
                      )}
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
                </>
              )}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_POLICY)}>
              <Plus className="h-4 w-4" /> 구간 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* 프리셋 적용 확인 */}
          {pendingPreset && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800 font-medium mb-2">
                이미 입력된 취소료가 있습니다. 어떻게 처리할까요?
              </p>
              <p className="text-xs text-amber-600 mb-3">
                선택한 취소료: <span className="font-semibold">{pendingPreset.label}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(pendingPreset, 'replace')}
                  className="rounded px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition"
                >
                  기존 삭제 후 불러오기
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(pendingPreset, 'append')}
                  className="rounded px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                >
                  기존 유지하고 추가
                </button>
                <button
                  type="button"
                  onClick={() => setPendingPreset(null)}
                  className="rounded px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 transition"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {fields.length === 0 && !pendingPreset && (
            <p className="py-4 text-center text-sm text-slate-400">취소료 불러오기 또는 구간을 직접 추가하세요</p>
          )}
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-start rounded-lg border border-slate-100 p-3">
                <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="label">구분</label>
                    <Input {...register(`policies.${i}.category`)} placeholder="크루즈" />
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
                  <div>
                    <label className="label">통화</label>
                    <div className="relative">
                      <Select {...register(`policies.${i}.fee_unit`)} className="appearance-none pr-7">
                        <option value="">-</option>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label">기준일 직접 지정 <span className="text-slate-400 font-normal">(비워두면 자동)</span></label>
                    <Input type="date" {...register(`policies.${i}.reference_date`)} className="h-[38px]" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">취소료 설명</label>
                    <Input {...register(`policies.${i}.fee_description`)} placeholder="예: 크루즈요금 25%" />
                  </div>
                  <div>
                    <label className="label">유형</label>
                    <div className="relative">
                      <Select {...register(`policies.${i}.fee_type`)} className="appearance-none pr-7">
                        <option value="">-</option>
                        <option value="percent">퍼센트</option>
                        <option value="fixed">정액</option>
                        <option value="free">무료</option>
                      </Select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="label">값</label>
                    <Input type="number" {...register(`policies.${i}.fee_value`)} placeholder="예: 25" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-2 shrink-0 rounded p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {managerOpen && (
        <CancellationPresetManager onClose={() => setManagerOpen(false)} />
      )}
    </>
  )
}
