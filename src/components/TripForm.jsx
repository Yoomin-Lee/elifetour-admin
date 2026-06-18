import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DatePicker } from './ui/date-picker'
import { statusOptions } from '../config/site'

const emptyForm = {
  title: '', destination: '', depart_date: '', return_date: '',
  status: 'upcoming', price_per_person: '', max_pax: '', manager: '', notes: '',
}

export default function TripForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      price_per_person: Number(form.price_per_person) || 0,
      max_pax: Number(form.max_pax) || 0,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">여행명 *</label>
          <input className="input" value={form.title} onChange={set('title')} required placeholder="예: 2025 유럽 10일" />
        </div>
        <div>
          <label className="label">목적지 *</label>
          <input className="input" value={form.destination} onChange={set('destination')} required placeholder="예: 프랑스·이탈리아" />
        </div>
        <div>
          <label className="label">상태</label>
          <div className="relative">
            <select className="select appearance-none pr-9" value={form.status} onChange={set('status')}>
              {statusOptions.trip.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="label">출발일 *</label>
          <DatePicker value={form.depart_date || ''} onChange={v => setForm(f => ({ ...f, depart_date: v }))} placeholder="출발일" />
        </div>
        <div>
          <label className="label">귀국일 *</label>
          <DatePicker value={form.return_date || ''} onChange={v => setForm(f => ({ ...f, return_date: v }))} placeholder="귀국일" />
        </div>
        <div>
          <label className="label">최대 인원</label>
          <input type="number" className="input" value={form.max_pax} onChange={set('max_pax')} placeholder="0" min="0" />
        </div>
        <div>
          <label className="label">1인 요금 (원)</label>
          <input type="number" className="input" value={form.price_per_person} onChange={set('price_per_person')} placeholder="0" min="0" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">담당자</label>
          <input className="input" value={form.manager} onChange={set('manager')} placeholder="담당 직원 이름" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">메모</label>
          <textarea className="input min-h-[80px] resize-y" value={form.notes} onChange={set('notes')} placeholder="내부 전달사항, 특이사항 등" />
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
