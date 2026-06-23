import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { voyageFormSchema, type VoyageFormValues } from '@/lib/schemas/voyage'
import { createVoyageWithChildren } from '@/lib/queries/voyages'
import BasicInfoSection from '@/components/voyages/BasicInfoSection'
import FlightsEditor from '@/components/voyages/FlightsEditor'
import ItineraryEditor from '@/components/voyages/ItineraryEditor'
import CancellationEditor from '@/components/voyages/CancellationEditor'
import CabinPriceSection from '@/components/voyages/CabinPriceSection'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

export default function VoyageNew() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoyageNewInner />
    </QueryClientProvider>
  )
}

function VoyageNewInner() {
  const navigate = useNavigate()

  const methods = useForm<VoyageFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(voyageFormSchema) as any,
    defaultValues: {
      status: '미오픈',
      cabin_total: 0,
      cabin_remaining: 0,
      customer_count: 0,
      flights: [],
      itinerary: [],
      policies: [],
    },
  })

  const mutation = useMutation({
    mutationFn: createVoyageWithChildren,
    onSuccess: (voyage) => {
      toast.success('새 행사가 등록됐습니다')
      navigate(`/voyages?tab=항차검색&voyage=${voyage.id}`)
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const onSubmit = (values: VoyageFormValues) => mutation.mutate(values)

  return (
    <FormProvider {...methods}>
      <div className="space-y-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/voyages')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">새 행사 등록</h1>
            <p className="text-sm text-slate-400">기본 정보를 입력하고 항공·기항지·취소료를 추가하세요</p>
          </div>
        </div>

        {mutation.isError && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            저장 중 오류가 발생했습니다. 다시 시도해주세요.
          </div>
        )}

        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          {/* 상단: 기본정보(좌) + 캐빈·항공(우) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
            <BasicInfoSection />
            <div className="space-y-4">
              <CabinPriceSection />
              <FlightsEditor />
            </div>
          </div>
          {/* 하단: 기항지(좌) + 취소료(우) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr] items-start">
            <ItineraryEditor />
            <CancellationEditor />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/voyages')}
              disabled={mutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '저장 중…' : '행사 등록'}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  )
}
