import { supabase } from '../supabase'
import type { Partner, PartnerType } from '../../types/database'

function sb() {
  if (!supabase) throw new Error('Supabase 클라이언트 미초기화')
  return supabase
}

export async function fetchPartners(type?: PartnerType): Promise<Partner[]> {
  let q = sb()
    .from('partners')
    .select('*')
    .order('name')
  if (type) q = q.eq('type', type)
  const { data, error } = await q
  if (error) throw error
  return data as Partner[]
}

export interface UpsertPartnerPayload {
  id?: string
  type: PartnerType
  name: string
  country: string | null
  region: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  memo: string | null
  is_active: boolean
}

export async function upsertPartner(payload: UpsertPartnerPayload): Promise<Partner> {
  const { data, error } = await sb()
    .from('partners')
    .upsert(
      { ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    .select()
    .single()
  if (error) throw error
  return data as Partner
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await sb()
    .from('partners')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function togglePartnerActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await sb()
    .from('partners')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
