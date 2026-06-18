import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Phone, BookOpen, Users } from 'lucide-react'
import { searchPassengers, getPassengersByTrip } from '../lib/passengers'
import { getTrips } from '../lib/trips'
import StatusBadge from '../components/StatusBadge'

function formatMoney(n) {
  if (!n) return '-'
  return Number(n).toLocaleString('ko-KR') + '원'
}

export default function Passengers() {
  const [allTrips, setAllTrips]       = useState([])
  const [yearFilter, setYearFilter]   = useState('ALL')
  const [selectedTripId, setSelectedTripId] = useState('')
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [mode, setMode]               = useState(null) // 'trip' | 'search'
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    getTrips().then(setAllTrips).catch(() => {})
  }, [])

  const years = useMemo(() => {
    const ys = new Set()
    allTrips.forEach(tr => {
      const y = tr.depart_date?.slice(0, 4)
      if (y) ys.add(y)
    })
    return Array.from(ys).sort().reverse()
  }, [allTrips])

  const filteredTrips = useMemo(() =>
    yearFilter === 'ALL'
      ? allTrips
      : allTrips.filter(tr => tr.depart_date?.startsWith(yearFilter)),
    [allTrips, yearFilter]
  )

  const selectedTrip = allTrips.find(tr => tr.id === selectedTripId)

  function handleYearChange(y) {
    setYearFilter(y)
    setSelectedTripId('')
    setResults([])
    setMode(null)
  }

  function handleTripChange(id) {
    setSelectedTripId(id)
    setQuery('')
    if (!id) { setResults([]); setMode(null); return }
    setLoading(true)
    getPassengersByTrip(id)
      .then(data => { setResults(data); setMode('trip') })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSelectedTripId('')
    try {
      const data = await searchPassengers(query.trim())
      setResults(data)
      setMode('search')
    } catch { setResults([]) } finally { setLoading(false) }
  }, [query])

  const isTripMode   = mode === 'trip'
  const isSearchMode = mode === 'search'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">고객 명단</h1>
        <p className="text-sm text-slate-500 mt-0.5">행사 선택 또는 이름·연락처·여권번호로 전체 조회</p>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* 연도 드롭다운 */}
        <select
          value={yearFilter}
          onChange={e => handleYearChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        >
          <option value="ALL">전체 연도</option>
          {years.map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>

        {/* 행사 드롭다운 */}
        <select
          value={selectedTripId}
          onChange={e => handleTripChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 sm:w-64"
        >
          <option value="">행사 선택…</option>
          {filteredTrips.map(tr => (
            <option key={tr.id} value={tr.id}>
              {tr.depart_date ? `${tr.depart_date.slice(0, 7)} ` : ''}{tr.title}
            </option>
          ))}
        </select>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* 텍스트 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            className="input flex-1 max-w-xs"
            placeholder="이름·연락처·여권번호 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '검색중...' : '검색'}
          </button>
        </form>
      </div>

      {/* 결과 영역 */}
      {(mode || loading) && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            {isTripMode && selectedTrip ? (
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-800">{selectedTrip.title}</p>
                {selectedTrip.depart_date && (
                  <span className="text-xs text-slate-400">{selectedTrip.depart_date} 출발</span>
                )}
                <span className="text-xs text-slate-500 ml-auto">{results.length}명</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-600">검색 결과 {results.length}건</p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">불러오는 중…</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Search className="h-8 w-8" />
              <p>{isTripMode ? '해당 행사에 고객이 없습니다' : '검색 결과가 없습니다'}</p>
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
                      {isSearchMode && (
                        <>
                          <th className="px-4 py-2.5 text-left font-medium">여행</th>
                          <th className="px-4 py-2.5 text-left font-medium">출발일</th>
                        </>
                      )}
                      <th className="px-4 py-2.5 text-left font-medium">결제</th>
                      <th className="px-4 py-2.5 text-left font-medium">입금액</th>
                      <th className="px-4 py-2.5 text-left font-medium">특이사항</th>
                      {isSearchMode && (
                        <th className="px-4 py-2.5 text-right font-medium">링크</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.phone || '-'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{p.passport_no || '-'}</td>
                        {isSearchMode && (
                          <>
                            <td className="px-4 py-2.5 text-slate-600 max-w-[140px] truncate">
                              {p.eli_trips?.title || p.trips?.title || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {p.eli_trips?.depart_date || p.trips?.depart_date || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2.5">
                          <StatusBadge type="payment" value={p.payment_status} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{formatMoney(p.payment_amount)}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[100px] truncate">{p.special_request || '-'}</td>
                        {isSearchMode && (
                          <td className="px-4 py-2.5 text-right">
                            <Link to={`/trips/${p.trip_id}`} className="text-xs text-brand hover:underline">
                              여행 보기
                            </Link>
                          </td>
                        )}
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
                    {isSearchMode && (
                      <p className="text-xs text-slate-500">
                        {p.eli_trips?.title || '-'} · {p.eli_trips?.depart_date || '-'}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone || '-'}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{p.passport_no || '-'}</span>
                    </div>
                    {isSearchMode && (
                      <Link to={`/trips/${p.trip_id}`} className="mt-2 inline-block text-xs text-brand font-medium">
                        여행 보기 →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!mode && !loading && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-300">
          <Users className="h-12 w-12" />
          <p className="text-sm">행사를 선택하거나 이름·연락처·여권번호로 검색하세요</p>
        </div>
      )}
    </div>
  )
}
