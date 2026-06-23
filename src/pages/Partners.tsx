import { useState, useMemo } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Search, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchPartners,
  upsertPartner,
  deletePartner,
  togglePartnerActive,
} from '@/lib/queries/partners'
import type { Partner, PartnerType } from '@/types/database'
import { PARTNER_TYPE_LABEL } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

// ── 탭 정의 ──────────────────────────────────────────────────────────────────

type TabKey = 'ALL' | PartnerType

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL',     label: '전체'   },
  { key: 'LAND',    label: '랜드사' },
  { key: 'CRUISE',  label: '크루즈사' },
  { key: 'AIRLINE', label: '항공사' },
  { key: 'HOTEL',   label: '호텔'   },
  { key: 'BUS',     label: '버스'   },
  { key: 'GUIDE',   label: '가이드' },
  { key: 'OTHER',   label: '기타'   },
]

// ── 폼 타입 ──────────────────────────────────────────────────────────────────

type PartnerForm = {
  type: PartnerType
  name: string
  country: string
  region: string
  contact_name: string
  contact_email: string
  contact_phone: string
  website: string
  memo: string
  is_active: boolean
}

const EMPTY_FORM: PartnerForm = {
  type: 'LAND',
  name: '',
  country: '',
  region: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  memo: '',
  is_active: true,
}

function toForm(p: Partner): PartnerForm {
  return {
    type: p.type,
    name: p.name,
    country: p.country ?? '',
    region: p.region ?? '',
    contact_name: p.contact_name ?? '',
    contact_email: p.contact_email ?? '',
    contact_phone: p.contact_phone ?? '',
    website: p.website ?? '',
    memo: p.memo ?? '',
    is_active: p.is_active,
  }
}

// ── 모달 폼 ──────────────────────────────────────────────────────────────────

function PartnerModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: PartnerForm
  onSave: (f: PartnerForm) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<PartnerForm>(initial)

  function set(field: keyof PartnerForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">
            {initial.name ? '협력업체 수정' : '협력업체 등록'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          {/* 유형 + 이름 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">유형</label>
              <div className="relative">
                <Select value={form.type} onChange={set('type') as React.ChangeEventHandler<HTMLSelectElement>} className="h-8 text-sm appearance-none pr-7">
                  {(Object.keys(PARTNER_TYPE_LABEL) as PartnerType[]).map(t => (
                    <option key={t} value={t}>{PARTNER_TYPE_LABEL[t]}</option>
                  ))}
                </Select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">업체명 <span className="text-red-400">*</span></label>
              <Input value={form.name} onChange={set('name')} placeholder="업체명" required className="h-8 text-sm" />
            </div>
          </div>

          {/* 국가 + 지역 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">국가</label>
              <Input value={form.country} onChange={set('country')} placeholder="예: 이탈리아" className="h-8 text-sm" />
            </div>
            <div>
              <label className="label">도시/지역</label>
              <Input value={form.region} onChange={set('region')} placeholder="예: 로마" className="h-8 text-sm" />
            </div>
          </div>

          {/* 담당자 + 전화 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">담당자</label>
              <Input value={form.contact_name} onChange={set('contact_name')} placeholder="담당자명" className="h-8 text-sm" />
            </div>
            <div>
              <label className="label">연락처</label>
              <Input value={form.contact_phone} onChange={set('contact_phone')} placeholder="+82-10-0000-0000" className="h-8 text-sm" />
            </div>
          </div>

          {/* 이메일 + 웹사이트 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">이메일</label>
              <Input value={form.contact_email} onChange={set('contact_email')} placeholder="example@email.com" type="email" className="h-8 text-sm" />
            </div>
            <div>
              <label className="label">웹사이트</label>
              <Input value={form.website} onChange={set('website')} placeholder="https://..." className="h-8 text-sm" />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="label">메모</label>
            <textarea
              value={form.memo}
              onChange={set('memo')}
              placeholder="계약 조건, 특이사항 등"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* 활성 여부 */}
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700 select-none cursor-pointer">
              활성 (거래중)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>취소</Button>
            <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

function Partners() {
  const { canWrite } = useAuth() as { canWrite: boolean }
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Partner | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)

  const { data: allPartners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => fetchPartners(),
    staleTime: 60_000,
  })

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allPartners.filter(p => {
      if (activeTab !== 'ALL' && p.type !== activeTab) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.country ?? '').toLowerCase().includes(q) ||
        (p.region ?? '').toLowerCase().includes(q) ||
        (p.contact_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [allPartners, activeTab, search])

  const upsertMut = useMutation({
    mutationFn: upsertPartner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      setEditTarget(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      setDeleteTarget(null)
    },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      togglePartnerActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  })

  function handleSave(form: PartnerForm) {
    const id = editTarget !== 'new' && editTarget ? editTarget.id : undefined
    upsertMut.mutate({
      id,
      type: form.type,
      name: form.name.trim(),
      country: form.country.trim() || null,
      region: form.region.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      website: form.website.trim() || null,
      memo: form.memo.trim() || null,
      is_active: form.is_active,
    })
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: allPartners.length }
    for (const p of allPartners) {
      c[p.type] = (c[p.type] ?? 0) + 1
    }
    return c
  }, [allPartners])

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <h1 className="text-base font-semibold text-slate-800 shrink-0">협력업체 관리</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="업체명·국가·담당자 검색"
                className="pl-7 h-7 text-sm w-48 sm:w-60"
              />
            </div>
            {canWrite && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setEditTarget('new')}>
                <Plus className="h-3.5 w-3.5" /> 등록
              </Button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <nav className="flex overflow-x-auto scrollbar-none px-4 gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'flex items-center gap-1 shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === t.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {t.label}
              {counts[t.key] != null && (
                <span className={[
                  'text-[10px] rounded-full px-1.5 py-0.5 font-semibold',
                  activeTab === t.key ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500',
                ].join(' ')}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 테이블 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-slate-400">불러오는 중…</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <span className="text-sm">등록된 협력업체가 없습니다.</span>
            {canWrite && (
              <Button size="sm" variant="outline" onClick={() => setEditTarget('new')}>
                <Plus className="h-3.5 w-3.5 mr-1" /> 첫 업체 등록
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-[5]">
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-medium w-20">유형</th>
                <th className="px-4 py-2 font-medium">업체명</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">국가 / 지역</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">담당자</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">연락처</th>
                <th className="px-4 py-2 font-medium hidden lg:table-cell">이메일</th>
                <th className="px-4 py-2 font-medium hidden lg:table-cell">메모</th>
                <th className="px-4 py-2 font-medium w-16 text-center">상태</th>
                {canWrite && <th className="px-4 py-2 font-medium w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(p => (
                <tr
                  key={p.id}
                  className={[
                    'hover:bg-slate-50 transition-colors',
                    !p.is_active ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <td className="px-4 py-2.5">
                    <TypeBadge type={p.type} />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {p.name}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 text-[10px] text-brand underline"
                        onClick={e => e.stopPropagation()}
                      >
                        웹사이트
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 hidden sm:table-cell">
                    {[p.country, p.region].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 hidden md:table-cell">
                    {p.contact_name || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 hidden md:table-cell">
                    {p.contact_phone || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 hidden lg:table-cell">
                    {p.contact_email || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs hidden lg:table-cell max-w-xs truncate">
                    {p.memo || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {canWrite ? (
                      <button
                        onClick={() => toggleMut.mutate({ id: p.id, is_active: !p.is_active })}
                        className="text-slate-400 hover:text-brand transition-colors"
                        title={p.is_active ? '비활성화' : '활성화'}
                      >
                        {p.is_active
                          ? <ToggleRight className="h-5 w-5 text-green-500" />
                          : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                      </button>
                    ) : (
                      <span className={p.is_active ? 'text-green-600 text-xs' : 'text-slate-400 text-xs'}>
                        {p.is_active ? '활성' : '비활성'}
                      </span>
                    )}
                  </td>
                  {canWrite && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="p-1 text-slate-400 hover:text-brand rounded"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {editTarget != null && (
        <PartnerModal
          initial={editTarget === 'new' ? EMPTY_FORM : toForm(editTarget)}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          saving={upsertMut.isPending}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 mx-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{deleteTarget.name}</span>을(를) 삭제하시겠습니까?
            </p>
            <p className="text-xs text-slate-400 mt-1">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>취소</Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
              >
                {deleteMut.isPending ? '삭제 중…' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 유형 뱃지 ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<PartnerType, string> = {
  LAND:    'bg-emerald-100 text-emerald-700',
  CRUISE:  'bg-cyan-100 text-cyan-700',
  AIRLINE: 'bg-blue-100 text-blue-700',
  HOTEL:   'bg-amber-100 text-amber-700',
  BUS:     'bg-orange-100 text-orange-700',
  GUIDE:   'bg-purple-100 text-purple-700',
  OTHER:   'bg-slate-100 text-slate-600',
}

function TypeBadge({ type }: { type: PartnerType }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[type]}`}>
      {PARTNER_TYPE_LABEL[type]}
    </span>
  )
}

// ── QueryClient 래퍼 ──────────────────────────────────────────────────────────

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function PartnersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Partners />
    </QueryClientProvider>
  )
}
