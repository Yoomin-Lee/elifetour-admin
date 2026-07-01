import { supabase } from '../supabase'
import type { PaymentSchedule, PaymentCategory, PaymentType, PaymentColumn, Voyage } from '../../types/database'

type VoyageRef = Pick<Voyage, 'region' | 'departure_date'>
export type PaymentScheduleRow = PaymentSchedule & { voyages: VoyageRef | null }

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchPaymentSchedules(voyageId: string): Promise<PaymentSchedule[]> {
  const { data, error } = await sb()
    .from('payment_schedules')
    .select('*')
    .eq('voyage_id', voyageId)
    .order('category')
    .order('payment_type')
  if (error) throw error
  return data as PaymentSchedule[]
}

export async function fetchAllPaymentSchedules(): Promise<PaymentScheduleRow[]> {
  const { data, error } = await sb()
    .from('payment_schedules')
    .select('*, voyages(region, departure_date)')
    .order('due_date')
  if (error) throw error
  return data as PaymentScheduleRow[]
}

/**
 * 달력 성능 최적화: 지정 연월의 마감일 데이터만 조회 (idx_payment_schedules_due_date 활용)
 */
export async function fetchPaymentSchedulesByMonth(
  year: number,
  month: number,  // 1-12
): Promise<PaymentScheduleRow[]> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const from = `${year}-${pad(month)}-01`
  const to   = `${year}-${pad(month)}-${pad(lastDay)}`
  const { data, error } = await sb()
    .from('payment_schedules')
    .select('*, voyages(region, departure_date)')
    .gte('due_date', from)
    .lte('due_date', to)
    .order('due_date')
  if (error) throw error
  return data as PaymentScheduleRow[]
}

export interface UpsertPaymentSchedulePayload {
  voyage_id: string
  category: PaymentCategory
  payment_type: PaymentType
  section: string
  agent_id: string
  amount: number
  currency: string
  due_date: string | null
  is_completed: boolean
  memo: string | null
}

export async function upsertPaymentSchedule(
  payload: UpsertPaymentSchedulePayload,
): Promise<PaymentSchedule> {
  const { data, error } = await sb()
    .from('payment_schedules')
    .upsert(
      { ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'voyage_id,category,payment_type,section,agent_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data as PaymentSchedule
}

/** voyage의 열 구성(payment_col_order) 조회 */
export async function fetchPaymentColOrder(voyageId: string): Promise<PaymentColumn[] | null> {
  const { data, error } = await sb()
    .from('voyages')
    .select('payment_col_order')
    .eq('id', voyageId)
    .single()
  if (error) throw error
  return (data as { payment_col_order: PaymentColumn[] | null }).payment_col_order
}

/** voyages.payment_col_order 저장 (열 순서·구성 팀 공유) */
export async function savePaymentColOrder(
  voyageId: string,
  columns: PaymentColumn[],
): Promise<void> {
  const { error } = await sb()
    .from('voyages')
    .update({ payment_col_order: columns })
    .eq('id', voyageId)
  if (error) throw error
}

/** 에이전트 열 원자적 삭제 — payment_schedules 행 + payment_col_order 항목을 단일 트랜잭션으로 */
export async function deleteAgentColumn(
  voyageId: string,
  agentId: string,
): Promise<void> {
  const { error } = await sb().rpc('delete_payment_agent_column', {
    p_voyage_id: voyageId,
    p_agent_id:  agentId,
  })
  if (error) throw error
}

export async function deletePaymentSchedule(id: string): Promise<void> {
  const { error } = await sb()
    .from('payment_schedules')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function restorePaymentSchedule(snapshot: PaymentSchedule): Promise<void> {
  const { error } = await sb()
    .from('payment_schedules')
    .upsert(snapshot, { onConflict: 'id' })
  if (error) throw error
}

export async function togglePaymentCompleted(id: string, is_completed: boolean): Promise<void> {
  const { error } = await sb()
    .from('payment_schedules')
    .update({ is_completed, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
