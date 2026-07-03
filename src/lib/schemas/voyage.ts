import { z } from 'zod'

const emptyToUndef = z.string().optional().transform(v => v === '' ? undefined : v)

export const segmentSchema = z.object({
  flight_no:      z.string().optional(),
  origin:         z.string().optional(),
  destination:    z.string().optional(),
  departure_date: z.string().optional(),
  departure_time: z.string().optional(),
  arrival_date:   z.string().optional(),
  arrival_time:   z.string().optional(),
  duration:       z.string().optional(),
})
export type FlightSegment = z.infer<typeof segmentSchema>

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
  seats_group:    z.coerce.number().min(0).default(0),
  seats_indivi:   z.coerce.number().min(0).default(0),
  seats_business: z.coerce.number().min(0).default(0),
  fare_base:      z.coerce.number().min(0).default(0),
  fare_fuel:      z.coerce.number().min(0).default(0),
  fare_tax:       z.coerce.number().min(0).default(0),
  segments:       z.array(segmentSchema).default([]),
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
  grade:     z.string().default(''),
  occupancy: z.coerce.number().min(1).max(4).nullable().optional(),
  total:     z.coerce.number().min(0).default(0),
  reserved:  z.coerce.number().min(0).default(0),
  ccf:       z.coerce.number().nullable().optional(),
  nccf:      z.coerce.number().nullable().optional(),
  tax:       z.coerce.number().nullable().optional(),
  tip:       z.coerce.number().nullable().optional(),
  currency:  z.string().default('USD'),
  agent:     z.string().optional(),
})

export type CabinGradeItem = z.infer<typeof cabinGradeItemSchema>

export const hotelItemSchema = z.object({
  hotel_name: z.string().default(''),
  stay_date:  emptyToUndef,
  room_rate:  z.coerce.number().nullable().optional(),
  currency:   z.string().default('USD'),
  memo:       z.string().optional(),
  sort_order: z.coerce.number().default(0),
})

export type HotelItem = z.infer<typeof hotelItemSchema>

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
  duration:        z.string().optional(),
  cabin_total:     z.coerce.number().min(0).default(0),
  cabin_remaining: z.coerce.number().min(0).default(0),
  customer_count:  z.coerce.number().min(0).default(0),
  tour_leader:     z.string().optional(),
  hotel:           z.string().optional(),
  product_price:   z.coerce.number().nullable().optional(),
  cabin_grades:    z.array(cabinGradeItemSchema).default([]),
  flights:         z.array(flightSchema).default([]),
  hotels:          z.array(hotelItemSchema).default([]),
  itinerary:       z.array(itinerarySchema).default([]),
  policies:        z.array(policySchema).default([]),
}).superRefine((data, ctx) => {
  const dep = data.departure_date
  const ret = data.return_date
  const board = data.boarding_date

  if (ret && ret < dep) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '귀국일은 출발일 이후여야 합니다',
      path: ['return_date'],
    })
  }

  if (board) {
    if (board < dep) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '승선일은 출발일 이후여야 합니다',
        path: ['boarding_date'],
      })
    }
    if (ret && board > ret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '승선일은 귀국일 이전이어야 합니다',
        path: ['boarding_date'],
      })
    }
  }
})

export type VoyageFormValues = z.infer<typeof voyageFormSchema>
