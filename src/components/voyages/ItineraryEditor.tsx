import { useState } from 'react'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'
import { Plus, Trash2, MapPin, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { ITINERARY_PRESETS, PRESET_OPTIONS } from '@/config/itineraryPresets'
import type { VoyageFormValues } from '@/lib/schemas/voyage'

const EMPTY_DAY = {
  date: '', port: '', arrival_time: '', departure_time: '', summary: '', sort_order: 0,
}

export default function ItineraryEditor() {
  const { register, control, formState: { errors } } = useFormContext<VoyageFormValues>()
  const { fields, append, remove, replace } = useFieldArray<VoyageFormValues, 'itinerary'>({ name: 'itinerary' })
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [presetOpen, setPresetOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<string | null>(null)

  function applyPreset(key: string, mode: 'replace' | 'append') {
    const preset = ITINERARY_PRESETS[key]
    if (!preset) return
    const rows = preset.ports.map((p, i) => ({
      date: '',
      port: p.port,
      arrival_time: p.arrival_time,
      departure_time: p.departure_time,
      summary: p.summary,
      sort_order: i + 1,
    }))
    if (mode === 'replace') {
      replace(rows)
    } else {
      rows.forEach(r => append(r))
    }
    setImportMsg(`${preset.label} — ${rows.length}개 기항지 불러옴`)
    setTimeout(() => setImportMsg(null), 4000)
    setPendingPreset(null)
    setPresetOpen(false)
  }

  function handlePresetSelect(key: string) {
    if (fields.length > 0) {
      setPendingPreset(key)
      setPresetOpen(false)
    } else {
      applyPreset(key, 'replace')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기항지 일정</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {importMsg && (
            <span className="text-xs text-brand font-medium">{importMsg}</span>
          )}

          {/* 루트 불러오기 드롭다운 */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPresetOpen(v => !v)}
              className="gap-1"
            >
              <MapPin className="h-3.5 w-3.5" />
              루트 불러오기
              <ChevronDown className={`h-3 w-3 transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
            </Button>
            {presetOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPresetOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden">
                  {PRESET_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePresetSelect(opt.value)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition"
                    >
                      <span className="font-medium text-slate-700">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(EMPTY_DAY)}
          >
            <Plus className="h-4 w-4" /> 직접 입력
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* 프리셋 적용 확인 */}
        {pendingPreset && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800 font-medium mb-2">
              이미 입력된 기항지가 있습니다. 어떻게 처리할까요?
            </p>
            <p className="text-xs text-amber-600 mb-3">
              선택한 루트: <span className="font-semibold">{ITINERARY_PRESETS[pendingPreset]?.label}</span>
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

        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            루트를 불러오거나 직접 입력하세요
          </p>
        ) : (
          <div className="space-y-2">
            {fields.map((field, i) => {
              const dayErrors = errors.itinerary?.[i]
              return (
                <div key={field.id} className="flex gap-2 items-start rounded-lg border border-slate-100 p-3">
                  <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
                    <div>
                      <label className="label">날짜 *</label>
                      <Controller
                        name={`itinerary.${i}.date`}
                        control={control}
                        render={({ field }) => (
                          <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="날짜 선택" />
                        )}
                      />
                      {dayErrors?.date && (
                        <p className="mt-0.5 text-xs text-red-500">{dayErrors.date.message}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">기항지 *</label>
                      <Input {...register(`itinerary.${i}.port`)} placeholder="바르셀로나 (스페인)" />
                      {dayErrors?.port && (
                        <p className="mt-0.5 text-xs text-red-500">{dayErrors.port.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">도착</label>
                      <Controller
                        name={`itinerary.${i}.arrival_time`}
                        control={control}
                        render={({ field }) => (
                          <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div>
                      <label className="label">출발</label>
                      <Controller
                        name={`itinerary.${i}.departure_time`}
                        control={control}
                        render={({ field }) => (
                          <TimePicker value={field.value ?? ''} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-5">
                      <label className="label">비고</label>
                      <Input {...register(`itinerary.${i}.summary`)} placeholder="주요 관광지, 이동 정보 등" />
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
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
