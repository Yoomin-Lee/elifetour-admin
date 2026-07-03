import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * 항차 관련 테이블 변경을 Supabase Realtime으로 구독.
 * 변경 발생 시 해당 React Query 캐시를 무효화해 자동 리페치.
 * 반환값 connected: 구독 연결 상태 (UI 표시용)
 */
export function useRealtimeSync(): { connected: boolean } {
  const qc = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('voyage-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voyages' }, () => {
        qc.invalidateQueries({ queryKey: ['voyages'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, () => {
        qc.invalidateQueries({ queryKey: ['flights'] })
        qc.invalidateQueries({ queryKey: ['all-voyage-flights'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_days' }, () => {
        qc.invalidateQueries({ queryKey: ['itinerary'] })
        qc.invalidateQueries({ queryKey: ['all-itinerary'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancellation_policies' }, () => {
        qc.invalidateQueries({ queryKey: ['cancellation'] })
        qc.invalidateQueries({ queryKey: ['all-cancellation'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history_logs' }, () => {
        qc.invalidateQueries({ queryKey: ['history'] })
        qc.invalidateQueries({ queryKey: ['all-history'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, () => {
        qc.invalidateQueries({ queryKey: ['all-hotels'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cabin_grades' }, () => {
        qc.invalidateQueries({ queryKey: ['cabin-grades'] })
        qc.invalidateQueries({ queryKey: ['all-cabin-grades'] })
        qc.invalidateQueries({ queryKey: ['voyages'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_schedules' }, () => {
        qc.invalidateQueries({ queryKey: ['payment-schedules'] })
        qc.invalidateQueries({ queryKey: ['all-payment-schedules'] })
      })
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  return { connected }
}
