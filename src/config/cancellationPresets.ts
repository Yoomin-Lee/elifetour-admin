export type CancellationPolicyPreset = {
  category: string
  start_d_minus: number | undefined
  end_d_minus: number | undefined
  fee_description: string
  fee_type: 'percent' | 'fixed' | 'free' | undefined
  fee_value: number | undefined
  fee_unit: string
  note: string
  sort_order: number
}

export type CancellationPreset = {
  label: string
  policies: CancellationPolicyPreset[]
}

export const CANCELLATION_PRESETS: Record<string, CancellationPreset> = {
  // ── 크루즈 일반 ────────────────────────────────────────────────────────────
  'cruise_90': {
    label: '크루즈 일반 (90일 기준)',
    policies: [
      { category: '크루즈', start_d_minus: undefined, end_d_minus: 91,        fee_description: '취소 무료',       fee_type: 'free',    fee_value: undefined, fee_unit: '',    note: '', sort_order: 1 },
      { category: '크루즈', start_d_minus: 90,         end_d_minus: 61,        fee_description: '크루즈요금 25%', fee_type: 'percent', fee_value: 25,        fee_unit: '',    note: '', sort_order: 2 },
      { category: '크루즈', start_d_minus: 60,         end_d_minus: 31,        fee_description: '크루즈요금 50%', fee_type: 'percent', fee_value: 50,        fee_unit: '',    note: '', sort_order: 3 },
      { category: '크루즈', start_d_minus: 30,         end_d_minus: 15,        fee_description: '크루즈요금 75%', fee_type: 'percent', fee_value: 75,        fee_unit: '',    note: '', sort_order: 4 },
      { category: '크루즈', start_d_minus: 14,         end_d_minus: undefined, fee_description: '크루즈요금 100%', fee_type: 'percent', fee_value: 100,      fee_unit: '',    note: '', sort_order: 5 },
    ],
  },

  // ── 코스타 크루즈 ──────────────────────────────────────────────────────────
  'cruise_costa': {
    label: '코스타 크루즈',
    policies: [
      { category: '크루즈', start_d_minus: undefined, end_d_minus: 91,        fee_description: '취소 무료',       fee_type: 'free',    fee_value: undefined, fee_unit: 'USD', note: '', sort_order: 1 },
      { category: '크루즈', start_d_minus: 90,         end_d_minus: 30,        fee_description: '크루즈요금 25%', fee_type: 'percent', fee_value: 25,        fee_unit: 'USD', note: '', sort_order: 2 },
      { category: '크루즈', start_d_minus: 29,         end_d_minus: 15,        fee_description: '크루즈요금 50%', fee_type: 'percent', fee_value: 50,        fee_unit: 'USD', note: '', sort_order: 3 },
      { category: '크루즈', start_d_minus: 14,         end_d_minus: 8,         fee_description: '크루즈요금 75%', fee_type: 'percent', fee_value: 75,        fee_unit: 'USD', note: '', sort_order: 4 },
      { category: '크루즈', start_d_minus: 7,          end_d_minus: undefined, fee_description: '크루즈요금 100%', fee_type: 'percent', fee_value: 100,      fee_unit: 'USD', note: '', sort_order: 5 },
    ],
  },

  // ── MSC 크루즈 ─────────────────────────────────────────────────────────────
  'cruise_msc': {
    label: 'MSC 크루즈',
    policies: [
      { category: '크루즈', start_d_minus: undefined, end_d_minus: 121,       fee_description: '취소 무료',       fee_type: 'free',    fee_value: undefined, fee_unit: 'USD', note: '', sort_order: 1 },
      { category: '크루즈', start_d_minus: 120,        end_d_minus: 91,        fee_description: '크루즈요금 15%', fee_type: 'percent', fee_value: 15,        fee_unit: 'USD', note: '', sort_order: 2 },
      { category: '크루즈', start_d_minus: 90,         end_d_minus: 61,        fee_description: '크루즈요금 25%', fee_type: 'percent', fee_value: 25,        fee_unit: 'USD', note: '', sort_order: 3 },
      { category: '크루즈', start_d_minus: 60,         end_d_minus: 31,        fee_description: '크루즈요금 50%', fee_type: 'percent', fee_value: 50,        fee_unit: 'USD', note: '', sort_order: 4 },
      { category: '크루즈', start_d_minus: 30,         end_d_minus: 8,         fee_description: '크루즈요금 75%', fee_type: 'percent', fee_value: 75,        fee_unit: 'USD', note: '', sort_order: 5 },
      { category: '크루즈', start_d_minus: 7,          end_d_minus: undefined, fee_description: '크루즈요금 100%', fee_type: 'percent', fee_value: 100,      fee_unit: 'USD', note: '', sort_order: 6 },
    ],
  },

  // ── 항공 일반 ──────────────────────────────────────────────────────────────
  'flight_standard': {
    label: '항공 일반',
    policies: [
      { category: '항공', start_d_minus: undefined, end_d_minus: 91,        fee_description: '취소 무료',     fee_type: 'free',    fee_value: undefined, fee_unit: 'KRW', note: '', sort_order: 1 },
      { category: '항공', start_d_minus: 90,         end_d_minus: 31,        fee_description: '항공요금 10%', fee_type: 'percent', fee_value: 10,        fee_unit: 'KRW', note: '', sort_order: 2 },
      { category: '항공', start_d_minus: 30,         end_d_minus: 8,         fee_description: '항공요금 30%', fee_type: 'percent', fee_value: 30,        fee_unit: 'KRW', note: '', sort_order: 3 },
      { category: '항공', start_d_minus: 7,          end_d_minus: undefined, fee_description: '항공요금 100%', fee_type: 'percent', fee_value: 100,      fee_unit: 'KRW', note: '', sort_order: 4 },
    ],
  },

  // ── 크루즈 + 항공 패키지 ───────────────────────────────────────────────────
  'package_standard': {
    label: '크루즈 + 항공 패키지',
    policies: [
      { category: '크루즈', start_d_minus: undefined, end_d_minus: 91,        fee_description: '취소 무료',       fee_type: 'free',    fee_value: undefined, fee_unit: '',    note: '', sort_order: 1 },
      { category: '크루즈', start_d_minus: 90,         end_d_minus: 61,        fee_description: '크루즈요금 25%', fee_type: 'percent', fee_value: 25,        fee_unit: '',    note: '', sort_order: 2 },
      { category: '크루즈', start_d_minus: 60,         end_d_minus: 31,        fee_description: '크루즈요금 50%', fee_type: 'percent', fee_value: 50,        fee_unit: '',    note: '', sort_order: 3 },
      { category: '크루즈', start_d_minus: 30,         end_d_minus: 15,        fee_description: '크루즈요금 75%', fee_type: 'percent', fee_value: 75,        fee_unit: '',    note: '', sort_order: 4 },
      { category: '크루즈', start_d_minus: 14,         end_d_minus: undefined, fee_description: '크루즈요금 100%', fee_type: 'percent', fee_value: 100,      fee_unit: '',    note: '', sort_order: 5 },
      { category: '항공',   start_d_minus: undefined, end_d_minus: 91,        fee_description: '취소 무료',       fee_type: 'free',    fee_value: undefined, fee_unit: 'KRW', note: '', sort_order: 6 },
      { category: '항공',   start_d_minus: 90,         end_d_minus: 31,        fee_description: '항공요금 10%',   fee_type: 'percent', fee_value: 10,        fee_unit: 'KRW', note: '', sort_order: 7 },
      { category: '항공',   start_d_minus: 30,         end_d_minus: 8,         fee_description: '항공요금 30%',   fee_type: 'percent', fee_value: 30,        fee_unit: 'KRW', note: '', sort_order: 8 },
      { category: '항공',   start_d_minus: 7,          end_d_minus: undefined, fee_description: '항공요금 100%',  fee_type: 'percent', fee_value: 100,       fee_unit: 'KRW', note: '', sort_order: 9 },
    ],
  },
}

export const CANCELLATION_PRESET_OPTIONS = Object.entries(CANCELLATION_PRESETS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))
