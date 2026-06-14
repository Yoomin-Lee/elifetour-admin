const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 overflow-hidden">
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
)

const RuleTable = ({ rows }: { rows: { d: string; fee: string; note?: string }[] }) => (
  <table className="w-full text-xs">
    <thead>
      <tr className="text-left text-slate-400">
        <th className="pb-1.5 font-medium w-32">D-day 기준</th>
        <th className="pb-1.5 font-medium">취소료</th>
        {rows.some(r => r.note) && <th className="pb-1.5 font-medium">비고</th>}
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {rows.map((r, i) => (
        <tr key={i}>
          <td className="py-1.5 text-slate-600">{r.d}</td>
          <td className="py-1.5 font-medium">{r.fee}</td>
          {rows.some(x => x.note) && <td className="py-1.5 text-slate-500">{r.note ?? ''}</td>}
        </tr>
      ))}
    </tbody>
  </table>
)

const TipTable = ({ rows }: { rows: { room: string; amount: string }[] }) => (
  <table className="w-full text-xs">
    <tbody className="divide-y divide-slate-100">
      {rows.map((r, i) => (
        <tr key={i}>
          <td className="py-1.5 text-slate-600 w-32">{r.room}</td>
          <td className="py-1.5 font-medium">{r.amount}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default function MNTab() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-slate-800">MN 참고 자료</h1>

      {/* 취소료 규정 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">선사별 크루즈 취소료 규정</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <Section title="코스타 취소료 규정 (2025~)">
            <p className="mb-2 text-[11px] text-slate-500">
              중동 그룹: 출발 90일 전 옵션 데잇<br />
              지중해 그룹: 출발 60일 전 옵션 데잇
            </p>
            <RuleTable rows={[
              { d: '90~60일 전', fee: 'DEPOSIT 20%' },
              { d: '60~45일 전', fee: '50%' },
              { d: '45~30일 전', fee: '75%' },
              { d: '30~0일 전', fee: '100%' },
            ]} />
          </Section>

          <Section title="TMK 취소료 규정">
            <RuleTable rows={[
              { d: '74~60일 전', fee: '신청금' },
              { d: '59~30일 전', fee: 'CCF+NCCF의 50%', note: '신청금이 더 클 경우 신청금 금액' },
              { d: '29~15일 전', fee: 'CCF+NCCF의 75%' },
              { d: '14~0일 전', fee: 'CCF+NCCF의 100%' },
            ]} />
          </Section>

          <Section title="여기어때 취소료 규정">
            <RuleTable rows={[
              { d: '75~61일 전', fee: '$125' },
              { d: '60~31일 전', fee: '50%' },
              { d: '30~15일 전', fee: '75%' },
              { d: '14~0일 전', fee: '100%' },
            ]} />
          </Section>

          <Section title="MSC 취소료 규정">
            <RuleTable rows={[
              { d: 'D-91 이상', fee: '€45' },
              { d: '90~61일 전', fee: 'FARE의 35%' },
              { d: '60~45일 전', fee: 'FARE의 50%' },
              { d: '44~21일 전', fee: 'FARE의 75%' },
              { d: '20~0일 전', fee: 'FARE의 100%' },
            ]} />
          </Section>

          <Section title="MSC 데포 규정">
            <RuleTable rows={[
              { d: '확정 시', fee: '15%' },
              { d: '90일 전', fee: '35%' },
              { d: '30일 전', fee: '잔금' },
            ]} />
          </Section>

          <Section title="KE 취소료 규정">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] text-slate-500 font-medium">미주/구주/대양주/중동/아프리카 행</p>
                <p className="mb-1 text-[10px] text-slate-400">60일 전 확정석 (80% 미만 사용 시 패널티)</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-slate-500 font-medium">동남아/서남아/괌/日/中/동북아/극동 행</p>
                <p className="mb-1 text-[10px] text-slate-400">45일 전 확정석 (80% 미만 사용 시 패널티)</p>
              </div>
              <RuleTable rows={[
                { d: 'D-~90', fee: '판매가 1%' },
                { d: 'D-89~60', fee: '판매가 2%' },
                { d: 'D-59~30', fee: '판매가 10%' },
                { d: 'D-29~15', fee: '판매가 30%' },
                { d: 'D-14~0', fee: '판매가 50%' },
              ]} />
            </div>
          </Section>
        </div>
      </div>

      {/* MSC World Europa 상세 규정 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">MSC World Europa 취소 수수료 규정</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Section title="27/05/08 월드유로파">
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-1">예약 데포짓 규정</p>
                <p>2026년 5월 15일까지: at confirmation 20% (Non-refundable)</p>
                <p>잔금: 2027년 4월 16일까지 100% 완납</p>
              </div>
              <RuleTable rows={[
                { d: '74일~60일 전', fee: '객실당 $150 USD' },
                { d: '59일~50일 전', fee: '크루즈 요금 25%' },
                { d: '49일~30일 전', fee: '크루즈 요금 50%' },
                { d: '출발 29일~당일', fee: '크루즈 요금 + 항구세 100%' },
              ]} />
              <p className="text-[10px] text-slate-400">영업일 오후 4시 이후 접수 시 다음 영업일 기준 처리</p>
            </div>
          </Section>

          <Section title="27/09/11 월드유로파">
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-1">예약 데포짓 규정</p>
                <p>2026년 6월 15일까지: at confirmation 20% (Non-refundable)</p>
                <p>잔금: 2027년 8월 31일까지 100% 완납</p>
              </div>
              <RuleTable rows={[
                { d: '74일~60일 전', fee: '객실당 $150 USD' },
                { d: '59일~50일 전', fee: '크루즈 요금 25%' },
                { d: '49일~30일 전', fee: '크루즈 요금 50%' },
                { d: '출발 29일~당일', fee: '크루즈 요금 + 항구세 100%' },
              ]} />
              <p className="text-[10px] text-slate-400">영업일 오후 4시 이후 접수 시 다음 영업일 기준 처리</p>
            </div>
          </Section>
        </div>
      </div>

      {/* 선내 팁 규정 */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">선내 팁 규정 (1박당 / 인당)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <Section title="코스타 크루즈 팁 (2026/01/12~)">
            <TipTable rows={[
              { room: '델리지오사 외', amount: '$13 성인 / $7 아동' },
              { room: '그 외 선박', amount: '$14.5 성인 / $7 아동' },
            ]} />
            <p className="mt-2 text-[10px] text-slate-400">
              델리지오사/디아데마/파시노사/퍼시피카/세레나/스메랄다/토스카나
            </p>
          </Section>

          <Section title="홀랜드 아메리카 팁 (2026/06/01~)">
            <TipTable rows={[
              { room: '스위트', amount: '$20' },
              { room: '그 외 객실', amount: '$18' },
            ]} />
          </Section>

          <Section title="로얄 캐리비안 팁">
            <TipTable rows={[
              { room: '스위트', amount: '$21' },
              { room: '그 외 객실', amount: '$18.5' },
            ]} />
          </Section>
        </div>
      </div>
    </div>
  )
}
