import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchMnSections,
  fetchDeletedMnSections,
  upsertMnSection,
  softDeleteMnSection,
  restoreMnSection,
  hardDeleteMnSection,
} from '@/lib/queries/mnSections'
import type { MnSection, MnRow } from '@/lib/queries/mnSections'
import { Button } from '@/components/ui/button'
import { FieldSelect } from '@/components/ui/field-select'

const CATEGORIES = ['취소료', 'MSC상세', '팁'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  '취소료': '선사별 크루즈 취소료 규정',
  'MSC상세': 'MSC World Europa 취소 수수료 규정',
  '팁': '선내 팁 규정 (1박당 / 인당)',
}

const EMPTY_RULE_ROW: MnRow = { d: '', fee: '', note: '' }
const EMPTY_TIP_ROW: MnRow = { room: '', amount: '' }

function emptySection(category: Category): Omit<MnSection, 'id'> {
  return {
    category,
    title: '',
    description: null,
    reference_url: null,
    row_type: category === '팁' ? 'tip' : 'rule',
    rows: category === '팁' ? [{ ...EMPTY_TIP_ROW }] : [{ ...EMPTY_RULE_ROW }],
    sort_order: 99,
  }
}

// ── 삭제 확인 모달 ─────────────────────────────────────────────────────────

function DeleteConfirmModal({
  title,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800">섹션을 삭제하시겠습니까?</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                <span className="font-medium text-slate-700">"{title}"</span> 섹션이 삭제됩니다.
                <br />
                삭제 후에도 하단의 '삭제된 항목'에서 복원할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-40"
          >
            {isPending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 행 편집 테이블 ─────────────────────────────────────────────────────────

function RowEditor({
  rows,
  rowType,
  onChange,
}: {
  rows: MnRow[]
  rowType: 'rule' | 'tip'
  onChange: (rows: MnRow[]) => void
}) {
  function updateRow(i: number, field: keyof MnRow, val: string) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange(next)
  }
  function addRow() {
    onChange([...rows, rowType === 'tip' ? { ...EMPTY_TIP_ROW } : { ...EMPTY_RULE_ROW }])
  }
  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-1 items-center">
          {rowType === 'rule' ? (
            <>
              <input
                value={r.d ?? ''} onChange={e => updateRow(i, 'd', e.target.value)}
                placeholder="D-day 기준" className="input h-7 text-xs flex-1 min-w-0" />
              <input
                value={r.fee ?? ''} onChange={e => updateRow(i, 'fee', e.target.value)}
                placeholder="취소료" className="input h-7 text-xs flex-1 min-w-0" />
              <input
                value={r.note ?? ''} onChange={e => updateRow(i, 'note', e.target.value)}
                placeholder="비고" className="input h-7 text-xs flex-[1.5] min-w-0" />
            </>
          ) : (
            <>
              <input
                value={r.room ?? ''} onChange={e => updateRow(i, 'room', e.target.value)}
                placeholder="객실 유형" className="input h-7 text-xs flex-1 min-w-0" />
              <input
                value={r.amount ?? ''} onChange={e => updateRow(i, 'amount', e.target.value)}
                placeholder="금액" className="input h-7 text-xs flex-1 min-w-0" />
            </>
          )}
          <button type="button" onClick={() => removeRow(i)}
            className="shrink-0 rounded p-1 text-slate-300 hover:text-red-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow}
        className="mt-1 flex items-center gap-1 text-xs text-brand hover:underline transition">
        <Plus className="h-3 w-3" /> 행 추가
      </button>
    </div>
  )
}

// ── 섹션 폼 ────────────────────────────────────────────────────────────────

function SectionForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: Omit<MnSection, 'id'> & { id?: string }
  onSave: (s: Omit<MnSection, 'id'> & { id?: string }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState(initial)

  return (
    <div className="space-y-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="label">제목 *</label>
          <input value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
            placeholder="예: MSC 취소료 규정" className="input text-sm" />
        </div>
        <div>
          <label className="label">카테고리</label>
          <FieldSelect
            value={form.category}
            options={[...CATEGORIES]}
            onChange={v => setForm(s => ({ ...s, category: v }))}
          />
        </div>
        <div>
          <label className="label">행 유형</label>
          <FieldSelect
            value={form.row_type}
            options={[
              { value: 'rule', label: '취소료 (D-day / 취소료 / 비고)' },
              { value: 'tip', label: '팁 (객실 / 금액)' },
            ]}
            onChange={v => setForm(s => ({ ...s, row_type: v as 'rule' | 'tip' }))}
          />
        </div>
        <div className="col-span-2">
          <label className="label">설명 / 부제목</label>
          <textarea value={form.description ?? ''}
            onChange={e => setForm(s => ({ ...s, description: e.target.value || null }))}
            rows={2} placeholder="추가 설명 (줄바꿈 가능)"
            className="input text-sm resize-none" />
        </div>
        <div className="col-span-2">
          <label className="label">참조 링크 (URL)</label>
          <input
            type="url"
            value={form.reference_url ?? ''}
            onChange={e => setForm(s => ({ ...s, reference_url: e.target.value || null }))}
            placeholder="https://..."
            className="input text-sm"
          />
        </div>
        <div>
          <label className="label">순서</label>
          <input type="number" value={form.sort_order}
            onChange={e => setForm(s => ({ ...s, sort_order: Number(e.target.value) }))}
            className="input h-8 text-sm" />
        </div>
      </div>

      <div>
        <label className="label mb-1 block">규정 행</label>
        <RowEditor rows={form.rows} rowType={form.row_type} onChange={rows => setForm(s => ({ ...s, rows }))} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSave(form)} disabled={isPending || !form.title.trim()}>
          <Check className="h-3.5 w-3.5" />{isPending ? '저장 중…' : '저장'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5" />취소
        </Button>
      </div>
    </div>
  )
}

// ── 섹션 카드 (보기) ────────────────────────────────────────────────────────

function SectionCard({
  section,
  canWrite,
  onEdit,
  onDelete,
}: {
  section: MnSection
  canWrite: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const hasNotes = section.rows.some(r => r.note)

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-4 py-2 gap-2">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex-1 min-w-0 truncate">
          {section.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {section.reference_url && (
            <a
              href={section.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-brand bg-brand/10 hover:bg-brand/20 transition"
              title="참조 링크 열기"
            >
              <ExternalLink className="h-3 w-3" />참조
            </a>
          )}
          {canWrite && (
            <>
              <button onClick={onEdit}
                className="rounded p-1 text-slate-400 hover:text-brand hover:bg-slate-100 transition"
                title="편집">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={onDelete}
                className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                title="삭제">
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        {section.description && (
          <p className="mb-2 text-[11px] text-slate-500 whitespace-pre-line">{section.description}</p>
        )}
        <table className="w-full text-xs">
          {section.row_type === 'rule' ? (
            <>
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-1.5 font-medium w-32">D-day 기준</th>
                  <th className="pb-1.5 font-medium">취소료</th>
                  {hasNotes && <th className="pb-1.5 font-medium">비고</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-slate-600">{r.d}</td>
                    <td className="py-1.5 font-medium">{r.fee}</td>
                    {hasNotes && <td className="py-1.5 text-slate-500">{r.note ?? ''}</td>}
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {section.rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-slate-600 w-32">{r.room}</td>
                  <td className="py-1.5 font-medium">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

// ── 카테고리 그룹 ──────────────────────────────────────────────────────────

function CategoryGroup({
  category,
  sections,
  canWrite,
  editingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDeleteRequest,
  savePending,
  newOpen,
  onNewOpen,
  onNewClose,
  onNewSave,
}: {
  category: Category
  sections: MnSection[]
  canWrite: boolean
  editingId: string | null
  onEdit: (s: MnSection) => void
  onCancelEdit: () => void
  onSave: (s: Omit<MnSection, 'id'> & { id?: string }) => void
  onDeleteRequest: (s: MnSection) => void
  savePending: boolean
  newOpen: boolean
  onNewOpen: () => void
  onNewClose: () => void
  onNewSave: (s: Omit<MnSection, 'id'>) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editForm, setEditForm] = useState<(Omit<MnSection, 'id'> & { id?: string }) | null>(null)

  function handleEdit(s: MnSection) {
    setEditForm(s)
    onEdit(s)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand transition"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {CATEGORY_LABELS[category]}
        </button>
        {canWrite && !collapsed && (
          <button
            type="button"
            onClick={onNewOpen}
            className="flex items-center gap-1 text-xs text-brand hover:underline transition"
          >
            <Plus className="h-3.5 w-3.5" /> 섹션 추가
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(s =>
            editingId === s.id && editForm ? (
              <div key={s.id} className="col-span-full">
                <SectionForm
                  initial={editForm}
                  onSave={next => { setEditForm(null); onSave(next) }}
                  onCancel={() => { setEditForm(null); onCancelEdit() }}
                  isPending={savePending}
                />
              </div>
            ) : (
              <SectionCard
                key={s.id}
                section={s}
                canWrite={canWrite}
                onEdit={() => handleEdit(s)}
                onDelete={() => onDeleteRequest(s)}
              />
            )
          )}
          {newOpen && (
            <div className="col-span-full">
              <SectionForm
                initial={emptySection(category)}
                onSave={s => onNewSave(s)}
                onCancel={onNewClose}
                isPending={savePending}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 삭제된 항목 패널 ───────────────────────────────────────────────────────

function DeletedPanel({
  canWrite,
  restorePending,
  hardDeletePending,
  onRestore,
  onHardDelete,
}: {
  canWrite: boolean
  restorePending: boolean
  hardDeletePending: boolean
  onRestore: (id: string) => void
  onHardDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmHardDelete, setConfirmHardDelete] = useState<MnSection | null>(null)

  const { data: deleted = [] } = useQuery({
    queryKey: ['mn-sections-deleted'],
    queryFn: fetchDeletedMnSections,
    enabled: canWrite,
  })

  if (!canWrite || deleted.length === 0) return null

  return (
    <>
      <div className="border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          삭제된 항목 ({deleted.length})
        </button>

        {open && (
          <div className="mt-3 space-y-2">
            {deleted.map(s => (
              <div key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-500 line-through truncate block">{s.title}</span>
                  <span className="text-[10px] text-slate-400">{s.category}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onRestore(s.id)}
                    disabled={restorePending}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-brand bg-brand/10 hover:bg-brand/20 transition disabled:opacity-40"
                  >
                    <RotateCcw className="h-3 w-3" /> 복원
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmHardDelete(s)}
                    disabled={hardDeletePending}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-red-500 bg-red-50 hover:bg-red-100 transition disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" /> 영구 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmHardDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmHardDelete(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800">영구 삭제하시겠습니까?</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-700">"{confirmHardDelete.title}"</span>이 영구적으로 삭제됩니다.
                    <br />이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmHardDelete(null)}
                disabled={hardDeletePending}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => { onHardDelete(confirmHardDelete.id); setConfirmHardDelete(null) }}
                disabled={hardDeletePending}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-40"
              >
                {hardDeletePending ? '삭제 중…' : '영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────

export default function MNTab() {
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MnSection | null>(null)

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['mn-sections'],
    queryFn: fetchMnSections,
  })

  const saveMut = useMutation({
    mutationFn: upsertMnSection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mn-sections'] })
      setEditingId(null)
      setNewCategory(null)
      toast.success('저장됐습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const softDeleteMut = useMutation({
    mutationFn: softDeleteMnSection,
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ['mn-sections'] })
      qc.invalidateQueries({ queryKey: ['mn-sections-deleted'] })
      setDeleteTarget(null)
      toast.success('삭제됐습니다', {
        action: {
          label: '되돌리기',
          onClick: () => restoreMut.mutate(id),
        },
      })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const restoreMut = useMutation({
    mutationFn: restoreMnSection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mn-sections'] })
      qc.invalidateQueries({ queryKey: ['mn-sections-deleted'] })
      toast.success('복원됐습니다')
    },
    onError: () => toast.error('복원에 실패했습니다'),
  })

  const hardDeleteMut = useMutation({
    mutationFn: hardDeleteMnSection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mn-sections-deleted'] })
      toast.success('영구 삭제됐습니다')
    },
    onError: () => toast.error('영구 삭제에 실패했습니다'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold text-slate-800">취소료 규정</h1>
        <p className="text-sm text-slate-400">불러오는 중…</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-lg font-bold text-slate-800">취소료 규정</h1>

        {CATEGORIES.map(cat => {
          const catSections = sections.filter(s => s.category === cat)
          return (
            <CategoryGroup
              key={cat}
              category={cat}
              sections={catSections}
              canWrite={canWrite}
              editingId={editingId}
              onEdit={s => setEditingId(s.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={s => saveMut.mutate(s)}
              onDeleteRequest={s => setDeleteTarget(s)}
              savePending={saveMut.isPending}
              newOpen={newCategory === cat}
              onNewOpen={() => setNewCategory(cat)}
              onNewClose={() => setNewCategory(null)}
              onNewSave={s => saveMut.mutate(s)}
            />
          )
        })}

        <DeletedPanel
          canWrite={canWrite}
          restorePending={restoreMut.isPending}
          hardDeletePending={hardDeleteMut.isPending}
          onRestore={id => restoreMut.mutate(id)}
          onHardDelete={id => hardDeleteMut.mutate(id)}
        />
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onConfirm={() => softDeleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={softDeleteMut.isPending}
        />
      )}
    </>
  )
}
