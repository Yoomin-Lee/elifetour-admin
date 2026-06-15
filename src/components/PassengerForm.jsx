import { useState } from 'react'
import { statusOptions } from '../config/site'

const emptyForm = {
  name: '', birth_date: '', gender: '', phone: '',
  passport_no: '', passport_expire: '', nationality: '한국',
  room_type: 'double', booking_status: 'inquiry',
  payment_status: 'pending', payment_amount: '',
  special_request: '', notes: '',
}

export default function PassengerForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, payment_amount: Number(form.payment_amount) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* 기본 정보 */}
        <div className="col-span-2">
          <label className="label">성명 *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="홍길동" />
        </div>
        <div>
          <label className="label">생년월일</label>
          <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} />
        </div>
        <div>
          <label className="label">성별</label>
          <select className="select" value={form.gender} onChange={set('gender')}>
            <option value="">선택</option>
            {statusOptions.gender.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">연락처</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" />
        </div>

        {/* 여권 */}
        <div>
          <label className="label">여권번호</label>
          <input className="input" value={form.passport_no} onChange={set('passport_no')} placeholder="M12345678" />
        </div>
        <div>
          <label className="label">여권만료일</label>
          <input type="date" className="input" value={form.passport_expire} onChange={set('passport_expire')} />
        </div>
        <div>
          <label className="label">국적</label>
          <input className="input" value={form.nationality} onChange={set('nationality')} placeholder="한국" />
        </div>
        <div>
          <label className="label">객실</label>
          <select className="select" value={form.room_type} onChange={set('room_type')}>
            {statusOptions.roomType.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 예약 단계 + 결제 */}
        <div>
          <label className="label">예약 단계</label>
          <select className="select" value={form.booking_status} onChange={set('booking_status')}>
            {statusOptions.booking.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">결제상태</label>
          <select className="select" value={form.payment_status} onChange={set('payment_status')}>
            {statusOptions.payment.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">입금액 (원)</label>
          <input type="number" className="input" value={form.payment_amount} onChange={set('payment_amount')} placeholder="0" min="0" />
        </div>

        {/* 특이사항 */}
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
