import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
}

export function ConfirmDeleteModal({ message, onConfirm, onCancel, pending }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 shrink-0">
            <AlertTriangle className="h-[18px] w-[18px] text-red-500" />
          </div>
          <p className="text-sm font-semibold text-slate-800">정말 삭제하시겠습니까?</p>
        </div>
        <p className="text-sm text-slate-500 mb-1">{message}</p>
        <p className="text-xs text-slate-400 mb-5">이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
          >
            {pending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
