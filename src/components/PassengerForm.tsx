import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DatePicker } from './ui/date-picker'
import { statusOptions } from '../config/site'

interface PassengerFormData {
  name: string
  birth_date: string
  gender: string
  phone: string
  passport_no: string
  passport_expire: string
  nationality: string
  room_type: string
  booking_status: string
  payment_status: string
  payment_amount: string | number
  special_request: string
  notes: string
}

interface PassengerFormProps {
  initial?: Partial<PassengerFormData>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean
}

const emptyForm: PassengerFormData = {
  name: '', birth_date: '', gender: '', phone: '',
  passport_no: '', passport_expire: '', nationality: '한국',
  room_type: 'double', booking_status: 'inquiry',
  payment_status: 'pending', payment_amount: '',
  special_request: '', notes: '',
}

export default function PassengerForm({ initial = {}, onSubmit, onCancel, loading }: PassengerFormProps) {
  const [form, setForm] = useState<PassengerFormData>({ ...emptyForm, ...initial })

  const set = (k: keyof PassengerFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, payment_amount: Number(form.payment_amount) || 0 })
  }

  const opts = statusOptions as Record<string, { value: string; label: string }[]>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">성명 *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="홍길동" />
        </div>
        <div>
          <label className="label">생년월일</label>
          <DatePicker value={String(form.birth_date || '')} onChange={v => setForm(f => ({ ...f, birth_date: v }))} placeholder="생년월일" />
        </div>
        <div>
          <label className="label">성별</label>
          <div className="relative">
            <select className="select appearance-none pr-9" value={form.gender} onChange={set('gender')}>
              <option value="">선택</option>
              {opts.gender.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="label">연락처</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" />
        </div>

        <div>
          <label className="label">여권번호</label>
          <input className="input" value={form.passport_no} onChange={set('passport_no')} placeholder="M12345678" />
        </div>
        <div>
          <label className="label">여권만료일</label>
          <DatePicker value={String(form.passport_expire || '')} onChange={v => setForm(f => ({ ...f, passport_expire: v }))} placeholder="여권만료일" />
        </div>
        <div>
          <label className="label">국적</label>
          <input className="input" value={form.nationality} onChange={set('nationality')} placeholder="한국" />
        </div>
        <div>
          <label className="label">객실</label>
          <div className="relative">
            <select className="select appearance-none pr-9" value={form.room_type} onChange={set('room_type')}>
              {opts.roomType.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="label">예약 단계</label>
          <div className="relative">
            <select className="select appearance-none pr-9" value={form.booking_status} onChange={set('booking_status')}>
              {opts.booking.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="label">결제상태</label>
          <div className="relative">
            <select className="select appearance-none pr-9" value={form.payment_status} onChange={set('payment_status')}>
              {opts.payment.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="label">입금액 (원)</label>
          <input type="number" className="input" value={form.payment_amount} onChange={set('payment_amount')} placeholder="0" min="0" />
        </div>

        <div className="col-span-2">
          <label className="label">특이사항</label>
          <input className="input" value={form.special_request} onChange={set('special_request')} placeholder="알레르기, 휠체어 등" />
        </div>
        <div className="col-span-2">
          <label className="label">내부 메모</label>
          <textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={set('notes')} placeholder="직원 내부 메모" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
