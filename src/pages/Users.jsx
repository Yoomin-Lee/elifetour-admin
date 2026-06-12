import { useEffect, useState } from 'react'
import { getProfiles, updateProfileRole } from '../lib/users'
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

export default function Users() {
  const { user: me } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(id, role) {
    setSaving(id)
    setError(null)
    try {
      const updated = await updateProfileRole(id, role)
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role: updated.role } : p)))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">직원 관리</h1>
        <p className="mt-0.5 text-sm text-slate-500">역할을 변경하면 즉시 적용됩니다.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">직원</th>
              <th className="px-5 py-3 text-left">이메일</th>
              <th className="px-5 py-3 text-left">역할</th>
              <th className="px-5 py-3 text-left">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map((p) => (
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
                  {p.id === me?.id ? (
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ROLE_COLOR[p.role] ?? ROLE_COLOR.staff}`}>
                      {ROLE_OPTIONS.find((r) => r.value === p.role)?.label ?? p.role}
                    </span>
                  ) : (
                    <select
                      value={p.role ?? 'staff'}
                      disabled={saving === p.id}
                      onChange={(e) => handleRoleChange(p.id, e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-400">{formatDate(p.created_at)}</td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  직원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
