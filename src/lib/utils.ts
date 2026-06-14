import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "2027-09-10" → "27/09/10(목)" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${yy}/${mm}/${dd}(${day})`
}

/** "2027-09-10" + "2027-09-19" → "9박 10일" */
export function calcNights(dep: string | null, ret: string | null): string {
  if (!dep || !ret) return '-'
  const diff = Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000)
  return `${diff}박 ${diff + 1}일`
}

/** "HH:MM:SS" → "HH:MM" */
export function formatTime(t: string | null | undefined): string {
  if (!t) return '-'
  return t.slice(0, 5)
}
