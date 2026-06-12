export const site = {
  brand: '이라이프투어',
  brandEn: 'eLIFETOUR',
  url: import.meta.env.VITE_SITE_URL || 'https://yoomin-lee.github.io/elifetour-admin',
}

export const statusOptions = {
  trip: [
    { value: 'upcoming',  label: '예정',   color: 'blue' },
    { value: 'ongoing',   label: '진행중', color: 'green' },
    { value: 'completed', label: '완료',   color: 'slate' },
    { value: 'cancelled', label: '취소',   color: 'red' },
  ],
  payment: [
    { value: 'pending',  label: '미납',   color: 'red' },
    { value: 'partial',  label: '일부납', color: 'yellow' },
    { value: 'paid',     label: '완납',   color: 'green' },
  ],
  gender: [
    { value: 'M', label: '남' },
    { value: 'F', label: '여' },
  ],
  roomType: [
    { value: 'single', label: '1인실' },
    { value: 'double', label: '2인실' },
    { value: 'triple', label: '3인실' },
  ],
}
