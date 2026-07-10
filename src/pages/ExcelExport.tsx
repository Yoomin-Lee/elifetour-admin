import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { exportAllVoyageData } from '@/lib/excel'
import { fetchVoyages } from '@/lib/queries/voyages'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'

const SHEETS = [
  '항차',
  '항공(마스터) · 항공좌석(보유현황)',
  '기항지',
  '취소료',
  '히스토리 · 피드백',
  '호텔',
  '캐빈등급(보유현황)',
  '결제스케줄',
]

function ExcelExportInner() {
  const [exporting, setExporting] = useState(false)
  const [yearFilter, setYearFilter] = useState<string[]>([])

  const { data: voyages = [] } = useQuery({ queryKey: ['voyages'], queryFn: fetchVoyages })

  const years = useMemo(() => {
    const ys = new Set<string>()
    voyages.forEach(v => { if (v.departure_date) ys.add(v.departure_date.slice(0, 4)) })
    return Array.from(ys).sort().reverse()
  }, [voyages])

  async function handleExport() {
    setExporting(true)
    try {
      const { filename, voyageCount } = await exportAllVoyageData(yearFilter)
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
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">포함되는 시트</p>
          <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
            {SHEETS.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-5 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting
            ? '내보내는 중…'
            : yearFilter.length === 0
              ? '전체 데이터 엑셀로 내보내기'
              : `${[...yearFilter].sort().join(', ')}년 데이터 엑셀로 내보내기`}
        </button>
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
