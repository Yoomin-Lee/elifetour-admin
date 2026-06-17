import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchMnSections,
  upsertMnSection,
  deleteMnSection,
} from '@/lib/queries/mnSections'
import type { MnSection, MnRow } from '@/lib/queries/mnSections'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['취소료', 'MSC상세', '팁'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  '취소료': '선사별 크루즈 취소료 규정',
  'MSC상세': 'MSC World Europa 취소 수수료 규정',
  '팁': '선내 팁 규정 (1박당 / 인당)',
}

// ── 빈 폼 ──────────────────────────────────────────────────────────────────

const EMPTY_RULE_ROW: MnRow = { d: '', fee: '', note: '' }
const EMPTY_TIP_ROW: MnRow = { room: '', amount: '' }

function emptySection(category: Category): Omit<MnSection, 'id'> {
  return {
    category,
    title: '',
    description: null,
    row_type: category === '팁' ? 'tip' : 'rule',
    rows: category === '팁' ? [{ ...EMPTY_TIP_ROW }] : [{ ...EMPTY_RULE_ROW }],
    sort_order: 99,
  }
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
          <select value={form.category}
            onChange={e => setForm(s => ({ ...s, category: e.target.value }))}
            className="select text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">행 유형</label>
          <select value={form.row_type}
            onChange={e => setForm(s => ({ ...s, row_type: e.target.value as 'rule' | 'tip' }))}
            className="select text-sm">
            <option value="rule">취소료 (D-day / 취소료 / 비고)</option>
            <option value="tip">팁 (객실 / 금액)</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">설명 / 부제목</label>
          <textarea value={form.description ?? ''}
            onChange={e => setForm(s => ({ ...s, description: e.target.value || null }))}
            rows={2} placeholder="추가 설명 (줄바꿈 가능)"
            className="input text-sm resize-none" />
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
        {canWrite && (
          <div className="flex items-center gap-1 shrink-0">
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
          </div>
        )}
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
  onDelete,
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
  onDelete: (id: string) => void
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
                onDelete={() => onDelete(s.id)}
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

// ── 메인 ──────────────────────────────────────────────────────────────────

export default function MNTab() {
  const qc = useQueryClient()
  const { canWrite } = useAuth() as { canWrite: boolean }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Category | null>(null)

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
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteMnSection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mn-sections'] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold text-slate-800">MN 참고 자료</h1>
        <p className="text-sm text-slate-400">불러오는 중…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-bold text-slate-800">MN 참고 자료</h1>

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
            onDelete={id => deleteMut.mutate(id)}
            savePending={saveMut.isPending}
            newOpen={newCategory === cat}
            onNewOpen={() => setNewCategory(cat)}
            onNewClose={() => setNewCategory(null)}
            onNewSave={s => saveMut.mutate(s)}
          />
        )
      })}
    </div>
  )
}
