import { useEffect, type RefObject } from 'react'

/** active일 때 ref 바깥을 클릭하면 onOutside 호출. 오버레이로 클릭을 가로채지 않아 같은 클릭이 다른 버튼(취소 등)에도 정상 전달된다. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [active, ref, onOutside])
}
