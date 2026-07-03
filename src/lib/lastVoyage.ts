// 항차 상세 탭에서 마지막으로 조회한 voyage id를 메모리에만 기억한다.
// (다른 탭/메뉴를 봐도 유지되지만, 새로고침하면 초기화됨 — 모듈이 다시 로드되므로)
let lastVoyageId: string | null = null

export function getLastVoyageId(): string | null {
  return lastVoyageId
}

export function setLastVoyageId(id: string | null) {
  lastVoyageId = id
}
