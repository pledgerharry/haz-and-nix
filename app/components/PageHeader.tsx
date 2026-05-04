'use client'
import { useRouter } from 'next/navigation'

// Height of the nav content (excl. safe area), used to offset page content
export const HEADER_CONTENT_H = 56

export default function PageHeader({
  title,
  showBack = true,
  right,
}: {
  title: string
  showBack?: boolean
  right?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: '#F7F5F1',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && (
          <button
            onClick={() => router.back()}
            style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#E4E1DB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '21px', color: '#18181A', flex: 1, margin: 0, lineHeight: '1.2' }}>{title}</h1>
        {right}
      </div>
    </div>
  )
}
