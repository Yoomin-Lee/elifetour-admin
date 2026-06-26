import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchCancellationPresets, createCancellationPreset,
  updateCancellationPreset, deleteCancellationPreset,
} from '@/lib/queries/cancellationPresets'
import type { CancellationPresetDB, CancellationPolicy } from '@/lib/queries/cancellationPresets'


const EMPTY_POLICY: CancellationPolicy = {
  category: '', start_d_minus: null, end_d_minus: null,
  fee_description: '', fee_type: null, fee_value: null,
  fee_unit: '', note: '', sort_order: 0,
}

function PolicyRow({
  policy, index, onChange, onRemove,
}: {
  policy: CancellationPolicy
  index: number
  onChange: (p: CancellationPolicy) => void
  onRemove: () => void
}) {
  const inp = 'rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand w-full'
  const sel = inp + ' appearance-none'

  return (
    <div className="rounded border border-slate-100 bg-white p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="w-4 shrink-0 text-[10px] text-slate-400 text-center">{index + 1}</span>
        <input
          value={policy.category}
          onChange={e => onChange({ ...policy, category: e.target.value })}
          placeholder="구분 (크루즈/항공)"
          className={inp + ' flex-1'}
        />
        <input
          value={policy.start_d_minus ?? ''}
          onChange={e => onChange({ ...policy, start_d_minus: e.target.value === '' ? null : Number(e.target.value) })}
          type="number"
          placeholder="시작 D-"
          className={inp + ' w-20 shrink-0'}
        />
        <span className="text-xs text-slate-400 shrink-0">~</span>
        <input
          value={policy.end_d_minus ?? ''}
          onChange={e => onChange({ ...policy, end_d_minus: e.target.value === '' ? null : Number(e.target.value) })}
          type="number"
          placeholder="종료 D-"
          className={inp + ' w-20 shrink-0'}
        />
        <button type="button" onClick={onRemove} className="shrink-0 text-slate-300 hover:text-red-500 transition">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 pl-5">
        <input
          value={policy.fee_description}
          onChange={e => onChange({ ...policy, fee_description: e.target.value })}
          placeholder="취소료 설명 (예: 크루즈요금 25%)"
          className={inp + ' flex-1'}
        />
        <select
          value={policy.fee_type ?? ''}
          onChange={e => onChange({ ...policy, fee_type: (e.target.value || null) as CancellationPolicy['fee_type'] })}
          className={sel + ' w-24 shrink-0'}
        >
          <option value="">유형</option>
          <option value="percent">퍼센트</option>
          <option value="fixed">정액</option>
          <option value="free">무료</option>
        </select>
        <input
          value={policy.fee_value ?? ''}
          onChange={e => onChange({ ...policy, fee_value: e.target.value === '' ? null : Number(e.target.value) })}
          type="number"
          placeholder="값"
          className={inp + ' w-16 shrink-0'}
        />

      </div>
    </div>
  )
}

function PresetItem({ preset }: { preset: CancellationPresetDB }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(preset.label)
  const [policies, setPolicies] = useState<CancellationPolicy[]>(preset.policies)
  const [dirty, setDirty] = useState(false)

  const updateMut = useMutation({
    mutationFn: () => updateCancellationPreset(preset.id, { label, policies }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cancellation-presets'] })
      setDirty(false)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteCancellationPreset(preset.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cancellation-presets'] })
      toast.success('삭제되었습니다')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  function updatePolicy(i: number, p: CancellationPolicy) {
    const next = [...policies]; next[i] = p; setPolicies(next); setDirty(true)
  }
  function removePolicy(i: number) {
    setPolicies(policies.filter((_, idx) => idx !== i)); setDirty(true)
  }
  function addPolicy() {
    setPolicies([...policies, { ...EMPTY_POLICY, sort_order: policies.length + 1 }]); setDirty(true)
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
        <button type="button" onClick={() => setOpen(v => !v)} className="shrink-0 text-slate-400 hover:text-slate-600 transition">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <input
          value={label}
          onChange={e => { setLabel(e.target.value); setDirty(true) }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-brand"
          placeholder="취소료 이름"
        />
        <span className="text-xs text-slate-400 shrink-0">{policies.length}구간</span>
        {dirty && (
          <button
            type="button"
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending}
            className="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition disabled:opacity-40"
          >
            <Save className="h-3 w-3" />{updateMut.isPending ? '저장 중…' : '저장'}
          </button>
        )}
        <button
          type="button"
          onClick={() => { if (confirm(`'${label}' 취소료를 삭제할까요?`)) deleteMut.mutate() }}
          disabled={deleteMut.isPending}
          className="shrink-0 text-slate-300 hover:text-red-500 transition disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 space-y-2">
          {policies.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">구간을 추가하세요</p>
          )}
          {policies.map((p, i) => (
            <PolicyRow
              key={i}
              policy={p}
              index={i}
              onChange={v => updatePolicy(i, v)}
              onRemove={() => removePolicy(i)}
            />
          ))}
          <button
            type="button"
            onClick={addPolicy}
            className="flex items-center gap-1 text-xs text-brand hover:underline mt-1"
          >
            <Plus className="h-3 w-3" /> 구간 추가
          </button>
        </div>
      )}
    </div>
  )
}

type Props = { onClose: () => void }

export default function CancellationPresetManager({ onClose }: Props) {
  const qc = useQueryClient()
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['cancellation-presets'],
    queryFn: fetchCancellationPresets,
  })

  const createMut = useMutation({
    mutationFn: () => createCancellationPreset({
      label: '새 취소료',
      policies: [],
      sort_order: (presets[presets.length - 1]?.sort_order ?? 0) + 1,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cancellation-presets'] })
      toast.success('새 취소료가 추가됐습니다')
    },
    onError: () => toast.error('추가에 실패했습니다'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">취소료 관리</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {isLoading && (
            <p className="text-center text-sm text-slate-400 py-8">불러오는 중…</p>
          )}
          {!isLoading && presets.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">등록된 취소료가 없습니다</p>
          )}
          {presets.map(p => (
            <PresetItem key={p.id} preset={p} />
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand border border-brand/30 hover:bg-brand/5 transition disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {createMut.isPending ? '추가 중…' : '새 취소료 추가'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
