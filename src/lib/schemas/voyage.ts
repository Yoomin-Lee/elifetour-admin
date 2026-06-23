import { z } from 'zod'

const emptyToUndef = z.string().optional().transform(v => v === '' ? undefined : v)

export const flightSchema = z.object({
  flight_no:      z.string().optional(),
  origin:         z.string().optional(),
  destination:    z.string().optional(),
  departure_date: emptyToUndef,
  arrival_date:   emptyToUndef,
  departure_time: emptyToUndef,
  arrival_time:   emptyToUndef,
  duration:       z.string().optional(),
  fare:           z.coerce.number().nullable().optional(),
  sort_order:     z.coerce.number().default(0),
})

export const itinerarySchema = z.object({
  date:           z.string().min(1, '날짜 필수'),
  port:           z.string().min(1, '기항지 필수'),
  arrival_time:   z.string().optional(),
  departure_time: z.string().optional(),
  category:       z.string().optional(),
  cost:           z.coerce.number().nullable().optional(),
  cost_currency:  z.string().optional(),
  summary:        z.string().optional(),
  sort_order:     z.coerce.number().default(0),
})

export const policySchema = z.object({
  category:       z.string().optional(),
  start_d_minus:  z.coerce.number().nullable().optional(),
  end_d_minus:    z.coerce.number().nullable().optional(),
  reference_date: emptyToUndef,
  fee_description:z.string().optional(),
  fee_type:       z.enum(['percent', 'fixed', 'free']).nullable().optional(),
  fee_value:      z.coerce.number().nullable().optional(),
  fee_unit:       z.string().optional(),
  note:           z.string().optional(),
  sort_order:     z.coerce.number().default(0),
})

export const cabinGradeItemSchema = z.object({
  grade:    z.string().default(''),
  total:    z.coerce.number().min(0).default(0),
  reserved: z.coerce.number().min(0).default(0),
  ccf:      z.coerce.number().nullable().optional(),
  nccf:     z.coerce.number().nullable().optional(),
  tax:      z.coerce.number().nullable().optional(),
  tip:      z.coerce.number().nullable().optional(),
  currency: z.string().default('USD'),
  agent:    z.string().optional(),
})

export type CabinGradeItem = z.infer<typeof cabinGradeItemSchema>

export const voyageFormSchema = z.object({
  region:          z.string().min(1, '지역/상품명을 입력하세요'),
  status:          z.enum(['미오픈', '판매중', '마감', '출발완료', '취소']),
  airline:         z.string().optional(),
  airline_return:  z.string().optional(),
  cruise_line:     z.string().optional(),
  ship_name:       z.string().optional(),
  departure_date:  z.string().min(1, '출발일을 입력하세요'),
  return_date:     z.string().optional(),
  boarding_date:   z.string().optional(),
  cabin_total:     z.coerce.number().min(0).default(0),
  cabin_remaining: z.coerce.number().min(0).default(0),
  customer_count:  z.coerce.number().min(0).default(0),
  tour_leader:     z.string().optional(),
  hotel:           z.string().optional(),
  cabin_grades:    z.array(cabinGradeItemSchema).default([]),
  flights:         z.array(flightSchema).default([]),
  itinerary:       z.array(itinerarySchema).default([]),
  policies:        z.array(policySchema).default([]),
})

export type VoyageFormValues = z.infer<typeof voyageFormSchema>
