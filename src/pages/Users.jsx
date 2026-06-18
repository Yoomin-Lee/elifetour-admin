import { useEffect, useState } from 'react'
import { getProfiles, updateProfile, approveProfile } from '../lib/users'
import { useAuth } from '../context/AuthContext'

const ROLE_OPTIONS = [
  { value: 'admin',  label: '관리자' },
  { value: 'staff',  label: '직원' },
  { value: 'escort', label: '인솔자' },
]

const ROLE_COLOR = {
  admin:  'bg-blue-100 text-blue-700',
  staff:  'bg-slate-100 text-slate-600',
  escort: 'bg-emerald-100 text-emerald-700',
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function EditModal({ profile, onClose, onSave, isMe }) {
  const [name, setName] = useState(profile.display_name || '')
  const [role, setRole] = useState(profile.role || 'staff')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateProfile(profile.id, { display_name: name.trim() || null, role })
      onSave(updated)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">직원 정보 수정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-bold">
              {(profile.display_name || profile.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">{profile.email}</p>
            <p className="text-xs text-slate-400">가입일 {formatDate(profile.created_at)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">역할</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {isMe && role !== 'admin' && (
              <p className="mt-1 text-xs text-amber-600">본인 역할을 관리자에서 변경하면 관리 권한을 잃습니다.</p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 transition"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApproveModal({ profile, onClose, onApprove }) {
  const [role, setRole] = useState('staff')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleApprove() {
    setSaving(true)
    setError(null)
    try {
      const updated = await approveProfile(profile.id, role)
      onApprove(updated)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">가입 승인</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-amber-200" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-amber-700 text-sm font-bold">
              {(profile.display_name || profile.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">{profile.display_name || profile.email?.split('@')[0]}</p>
            <p className="truncate text-xs text-slate-400">{profile.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">역할 지정</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleApprove}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 transition"
          >
            {saving ? '처리 중…' : '승인하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const { user: me } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated) {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    setEditTarget(null)
  }

  function handleApproved(updated) {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    setApproveTarget(null)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  const pending = profiles.filter((p) => p.status !== 'approved')
  const approved = profiles.filter((p) => p.status === 'approved')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">직원 관리</h1>
        <p className="mt-0.5 text-sm text-slate-500">역할을 변경하면 즉시 적용됩니다.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* 승인 대기 섹션 */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-amber-700">승인 대기</h2>
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pending.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
            <table className="w-full text-sm">
              <thead className="border-b border-amber-200 bg-amber-100/60 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">직원</th>
                  <th className="px-5 py-3 text-left">이메일</th>
                  <th className="px-5 py-3 text-left">가입일</th>
                  <th className="px-5 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pending.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-amber-200" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-700 text-xs font-bold">
                            {(p.display_name || p.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">
                          {p.display_name || p.email?.split('@')[0] || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{p.email}</td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setApproveTarget(p)}
                        className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 transition"
                      >
                        승인
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 승인된 직원 목록 */}
      <div className="space-y-3">
        {pending.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-500">승인된 직원</h2>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">직원</th>
                <th className="px-5 py-3 text-left">이메일</th>
                <th className="px-5 py-3 text-left">역할</th>
                <th className="px-5 py-3 text-left">가입일</th>
                <th className="px-5 py-3 text-right">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approved.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                          {(p.display_name || p.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-slate-800">
                        {p.display_name || p.email?.split('@')[0] || '-'}
                        {p.id === me?.id && (
                          <span className="ml-1.5 text-xs text-slate-400">(나)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{p.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ROLE_COLOR[p.role] ?? ROLE_COLOR.staff}`}>
                      {ROLE_OPTIONS.find((r) => r.value === p.role)?.label ?? p.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setEditTarget(p)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    승인된 직원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <EditModal
          profile={editTarget}
          isMe={editTarget.id === me?.id}
          onClose={() => setEditTarget(null)}
          onSave={handleSaved}
        />
      )}

      {approveTarget && (
        <ApproveModal
          profile={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApprove={handleApproved}
        />
      )}
    </div>
  )
}
