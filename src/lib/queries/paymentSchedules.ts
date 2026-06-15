import { supabase } from '../supabase'
import type { PaymentSchedule, PaymentCategory, PaymentType, Voyage } from '../../types/database'

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

export interface UpsertPaymentSchedulePayload {
  voyage_id: string
  category: PaymentCategory
  payment_type: PaymentType
  amount: number
  currency: string
  due_date: string
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
      { onConflict: 'voyage_id,category,payment_type' },
    )
    .select()
    .single()
  if (error) throw error
  return data as PaymentSchedule
}

export async function deletePaymentSchedule(id: string): Promise<void> {
  const { error } = await sb()
    .from('payment_schedules')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function togglePaymentCompleted(id: string, is_completed: boolean): Promise<void> {
  const { error } = await sb()
    .from('payment_schedules')
    .update({ is_completed, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
