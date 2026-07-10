import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { exportAllVoyageData } from '@/lib/excel'

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

export default function ExcelExport() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await exportAllVoyageData()
      toast.success('엑셀 파일이 다운로드되었습니다')
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
        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">포함되는 시트</p>
        <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
          {SHEETS.map(s => <li key={s}>{s}</li>)}
        </ul>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-5 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? '내보내는 중…' : '전체 데이터 엑셀로 내보내기'}
        </button>
      </div>
    </div>
  )
}
