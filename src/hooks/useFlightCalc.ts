import { useMemo } from 'react'
import { calcFlightDuration, type FlightCalculationParams, type FlightCalculationResult } from '../lib/utils/flightCalc'

/**
 * 실시간 비행시간 계산 훅
 * 입력값이 바뀔 때마다 DST 반영 duration 자동 갱신
 *
 * @example
 * const { result, isValid } = useFlightCalc({
 *   departureAirport: 'ICN',
 *   arrivalAirport: 'SIN',
 *   departureDate: '2026-12-15',
 *   departureTime: '14:35',
 *   arrivalDate: '2026-12-15',
 *   arrivalTime: '20:10',
 * })
 * // result.durationText === "5시간 35분"
 */
export function useFlightCalc(params: Partial<FlightCalculationParams>): {
  result: FlightCalculationResult | null
  isValid: boolean
} {
  const result = useMemo<FlightCalculationResult | null>(() => {
    const { departureAirport, arrivalAirport, departureDate, departureTime, arrivalDate, arrivalTime } = params

    if (!departureAirport || !arrivalAirport || !departureDate || !departureTime || !arrivalDate || !arrivalTime) {
      return null
    }

    try {
      return calcFlightDuration({
        departureAirport,
        arrivalAirport,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
      })
    } catch {
      return null
    }
  }, [
    params.departureAirport,
    params.arrivalAirport,
    params.departureDate,
    params.departureTime,
    params.arrivalDate,
    params.arrivalTime,
  ])

  return { result, isValid: result !== null && result.durationMinutes > 0 }
}
