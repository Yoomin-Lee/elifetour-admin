import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { searchPassengers } from '../lib/passengers'
import StatusBadge from '../components/StatusBadge'

function formatMoney(n) {
  if (!n) return '-'
  return Number(n).toLocaleString('ko-KR') + '원'
}

export default function Passengers() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await searchPassengers(query.trim())
      setResults(data)
      setSearched(true)
    } catch { setResults([]) } finally { setLoading(false) }
  }, [query])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">여행자 명단 검색</h1>
        <p className="text-sm text-slate-500 mt-0.5">이름, 연락처, 여권번호로 전체 조회</p>
      </div>

      {/* 검색창 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="input flex-1 max-w-md"
          placeholder="이름·연락처·여권번호 입력"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '검색중...' : '검색'}
        </button>
      </form>

      {/* 검색 결과 */}
      {searched && !loading && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-medium text-slate-600">검색 결과 {results.length}건</p>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <span className="text-3xl">🔍</span>
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 데스크탑 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                      <th className="px-4 py-2.5 text-left font-medium">성명</th>
                      <th className="px-4 py-2.5 text-left font-medium">연락처</th>
                      <th className="px-4 py-2.5 text-left font-medium">여권번호</th>
                      <th className="px-4 py-2.5 text-left font-medium">여행</th>
                      <th className="px-4 py-2.5 text-left font-medium">출발일</th>
                      <th className="px-4 py-2.5 text-left font-medium">결제</th>
                      <th className="px-4 py-2.5 text-left font-medium">입금액</th>
                      <th className="px-4 py-2.5 text-left font-medium">특이사항</th>
                      <th className="px-4 py-2.5 text-right font-medium">링크</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.phone || '-'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{p.passport_no || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[140px] truncate">
                          {p.eli_trips?.title || p.trips?.title || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {p.eli_trips?.depart_date || p.trips?.depart_date || '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge type="payment" value={p.payment_status} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{formatMoney(p.payment_amount)}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[100px] truncate">{p.special_request || '-'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Link to={`/trips/${p.trip_id}`} className="text-xs text-brand hover:underline">
                            여행 보기
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 */}
              <div className="md:hidden divide-y divide-slate-50">
                {results.map((p) => (
                  <div key={p.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <StatusBadge type="payment" value={p.payment_status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.eli_trips?.title || '-'} · {p.eli_trips?.depart_date || '-'}
                    </p>
                    <div className="flex gap-4 text-xs text-slate-600 mt-1">
                      <span>📞 {p.phone || '-'}</span>
                      <span>🛂 {p.passport_no || '-'}</span>
                    </div>
                    <Link to={`/trips/${p.trip_id}`} className="mt-2 inline-block text-xs text-brand font-medium">
                      여행 보기 →
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-300">
          <span className="text-5xl">👥</span>
          <p className="text-sm">이름, 연락처, 여권번호로 검색하세요</p>
        </div>
      )}
    </div>
  )
}
