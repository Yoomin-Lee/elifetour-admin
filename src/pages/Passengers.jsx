import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Phone, BookOpen, Users, ChevronDown } from 'lucide-react'
import { searchPassengers, getPassengersByVoyage } from '../lib/passengers'
import { fetchVoyages } from '../lib/queries/voyages'
import { voyageTitle } from '../types/database'
import StatusBadge from '../components/StatusBadge'

function formatMoney(n) {
  if (!n) return '-'
  return Number(n).toLocaleString('ko-KR') + '원'
}

export default function Passengers() {
  const [allVoyages, setAllVoyages]       = useState([])
  const [yearFilter, setYearFilter]       = useState('ALL')
  const [selectedVoyageId, setSelectedVoyageId] = useState('')
  const [query, setQuery]                 = useState('')
  const [results, setResults]             = useState([])
  const [mode, setMode]                   = useState(null) // 'voyage' | 'search'
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    fetchVoyages().then(setAllVoyages).catch(() => {})
  }, [])

  const years = useMemo(() => {
    const ys = new Set()
    allVoyages.forEach(v => {
      const y = v.departure_date?.slice(0, 4)
      if (y) ys.add(y)
    })
    return Array.from(ys).sort().reverse()
  }, [allVoyages])

  const filteredVoyages = useMemo(() =>
    yearFilter === 'ALL'
      ? allVoyages
      : allVoyages.filter(v => v.departure_date?.startsWith(yearFilter)),
    [allVoyages, yearFilter]
  )

  const selectedVoyage = allVoyages.find(v => v.id === selectedVoyageId)

  function handleYearChange(y) {
    setYearFilter(y)
    setSelectedVoyageId('')
    setResults([])
    setMode(null)
  }

  function handleVoyageChange(id) {
    setSelectedVoyageId(id)
    setQuery('')
    if (!id) { setResults([]); setMode(null); return }
    setLoading(true)
    getPassengersByVoyage(id)
      .then(data => { setResults(data); setMode('voyage') })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSelectedVoyageId('')
    try {
      const data = await searchPassengers(query.trim())
      setResults(data)
      setMode('search')
    } catch { setResults([]) } finally { setLoading(false) }
  }, [query])

  const isVoyageMode = mode === 'voyage'
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
        <div className="relative">
          <select
            value={yearFilter}
            onChange={e => handleYearChange(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          >
            <option value="ALL">전체 연도</option>
            {years.map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        {/* 행사 드롭다운 */}
        <div className="relative sm:w-64">
          <select
            value={selectedVoyageId}
            onChange={e => handleVoyageChange(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          >
            <option value="">행사 선택…</option>
            {filteredVoyages.map(v => (
              <option key={v.id} value={v.id}>{voyageTitle(v)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

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
            {isVoyageMode && selectedVoyage ? (
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-800">{voyageTitle(selectedVoyage)}</p>
                {selectedVoyage.departure_date && (
                  <span className="text-xs text-slate-400">{selectedVoyage.departure_date} 출발</span>
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
              <p>{isVoyageMode ? '해당 행사에 고객이 없습니다' : '검색 결과가 없습니다'}</p>
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
