// 탭별로 마지막 조회한 voyage id를 메모리에만 기억한다.
// (다른 탭/메뉴를 봐도 유지되지만, 새로고침하면 초기화됨 — 모듈이 다시 로드되므로)
// 탭마다 독립적으로 기억하도록 key로 구분 (예: 'search', 'payment').
const store: Record<string, string | null> = {}

export function getLastVoyageId(key: string): string | null {
  return store[key] ?? null
}

export function setLastVoyageId(key: string, id: string | null) {
  store[key] = id
}
