'use client'
import { useRouter, usePathname } from 'next/navigation'

const ITEMS = [
  {
    href: '/home',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H14v-5H8v5H4a1 1 0 0 1-1-1V9.5z" stroke={active ? '#F68233' : '#ADADB3'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dates',
    label: 'Dates',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2l2.4 4.8 5.6.8-4 3.9 1 5.5L11 14.5l-5 2.5 1-5.5L3 7.6l5.6-.8L11 2z" stroke={active ? '#F68233' : '#ADADB3'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/snap',
    label: 'Snap',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="6" width="18" height="13" rx="3" stroke={active ? '#F68233' : '#ADADB3'} strokeWidth="1.5" />
        <circle cx="11" cy="12.5" r="3" stroke={active ? '#F68233' : '#ADADB3'} strokeWidth="1.5" />
        <path d="M8 6l1.2-2.5h3.6L14 6" stroke={active ? '#F68233' : '#ADADB3'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/more',
    label: 'More',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="5" cy="11" r="1.5" fill={active ? '#F68233' : '#ADADB3'} />
        <circle cx="11" cy="11" r="1.5" fill={active ? '#F68233' : '#ADADB3'} />
        <circle cx="17" cy="11" r="1.5" fill={active ? '#F68233' : '#ADADB3'} />
      </svg>
    ),
  },
]

export default function Nav() {
  const router = useRouter()
  const path = usePathname()

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '9px', paddingLeft: '4px', paddingRight: '4px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
      {ITEMS.map(item => {
        const active = path === item.href
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 14px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'system-ui' }}
          >
            {item.icon(active)}
            <span style={{ fontSize: '9px', fontWeight: '500', letterSpacing: '0.02em', color: active ? '#F68233' : '#ADADB3' }}>{item.label}</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: active ? '#F68233' : 'transparent' }} />
          </button>
        )
      })}
    </div>
  )
}
