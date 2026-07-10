import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { exportAllVoyageData, SHEET_DEFS, type SheetKey } from '@/lib/excel'
import { fetchVoyages } from '@/lib/queries/voyages'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { Checkbox } from '@/components/ui/checkbox'

const ALL_SHEET_KEYS = SHEET_DEFS.map(s => s.key)

function ExcelExportInner() {
  const [exporting, setExporting] = useState(false)
  const [yearFilter, setYearFilter] = useState<string[]>([])
  const [selectedSheets, setSelectedSheets] = useState<Set<SheetKey>>(new Set(ALL_SHEET_KEYS))

  const { data: voyages = [] } = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages })

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  const allSheetsSelected = selectedSheets.size === ALL_SHEET_KEYS.length

  function toggleSheet(key: SheetKey) {
    setSelectedSheets(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAllSheets() {
    setSelectedSheets(allSheetsSelected ? new Set() : new Set(ALL_SHEET_KEYS))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const { filename, voyageCount } = await exportAllVoyageData(yearFilter, Array.from(selectedSheets))
      toast.success('엑셀 파일이 다운로드되었습니다', {
        description: `행사 ${voyageCount}건 · ${filename}`,
      })
    } catch {
      toast.error('내보내기에 실패했습니다')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-bold text-slate-800">엑셀 내보내기</h1>
      <p className="mt-1 text-sm text-slate-400">
        항차와 연결된 항공·기항지·취소료·결제·피드백 등 모든 상세데이터를 시트별로 나눠
        하나의 엑셀 파일로 내보냅니다. 데이터를 백업하거나 다른 곳으로 이관할 때 사용하세요.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">내보낼 연도</p>
          <MultiSelectDropdown
            allLabel="전체 연도"
            options={years}
            selected={yearFilter}
            onChange={setYearFilter}
            formatOption={y => `${y}년`}
          />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">포함되는 시트</p>
            <button
              type="button"
              onClick={toggleAllSheets}
              className="text-xs font-medium text-brand hover:underline"
            >
              {allSheetsSelected ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <ul className="space-y-0.5">
            {SHEET_DEFS.map(s => (
              <li key={s.key}>
                <label className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 cursor-pointer">
                  <Checkbox checked={selectedSheets.has(s.key)} onChange={() => toggleSheet(s.key)} />
                  {s.label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || selectedSheets.size === 0}
          className="mt-5 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting
            ? '내보내는 중…'
            : yearFilter.length === 0
              ? '전체 데이터 엑셀로 내보내기'
              : `${[...yearFilter].sort().join(', ')}년 데이터 엑셀로 내보내기`}
        </button>
        {selectedSheets.size === 0 && (
          <p className="mt-2 text-xs text-red-500">시트를 1개 이상 선택하세요.</p>
        )}
      </div>
    </div>
  )
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function ExcelExport() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExcelExportInner />
    </QueryClientProvider>
  )
}
