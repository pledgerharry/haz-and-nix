'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context'
import { useRouter } from 'next/navigation'
import { db } from '../firebase'
import { doc, setDoc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import Nav from '../components/Nav'
import { repeatLabel, formatReminderDate } from '../reminders/page'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [nextDate, setNextDate] = useState({ date: '', location: '' })
  const [sleeps, setSleeps] = useState<number | null>(null)
  const [daysTogether, setDaysTogether] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [editingNextUp, setEditingNextUp] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [savingNextUp, setSavingNextUp] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])

  const [notifs, setNotifs] = useState({
    notes: 0,
    question: false,
    snap: false,
    wyr: false,
  })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !loading && !user) router.push('/')
  }, [user, loading, router, mounted])

  // Live listener for next up
  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'shared', 'nextup'), snap => {
      if (snap.exists()) setNextDate(snap.data() as any)
    })
  }, [user])

  useEffect(() => {
    const start = new Date('2025-09-04')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setDaysTogether(Math.round((today.getTime() - start.getTime()) / 86400000))
    if (nextDate.date) {
      const next = new Date(nextDate.date + 'T00:00:00')
      setSleeps(Math.max(0, Math.round((next.getTime() - today.getTime()) / 86400000)))
    }
  }, [nextDate])

  // Reminders listener
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user])

  useEffect(() => {
    if (!user) return
    const isHarry = user.email === HARRY_EMAIL
    const otherQKey = isHarry ? 'nicoleAnswer' : 'harryAnswer'
    const otherSnapKey = isHarry ? 'nicoleUrl' : 'harryUrl'
    const otherWyrKey = isHarry ? 'nicoleChoice' : 'harryChoice'
    const otherName = isHarry ? 'Nicole' : 'Harry'

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const unsubs: (() => void)[] = []

    const notesQ = query(collection(db, 'notes'), where('fromName', '==', otherName), orderBy('createdAt', 'desc'))
    unsubs.push(onSnapshot(notesQ, snap => {
      const count = snap.docs.filter(d => {
        const ts = d.data().createdAt?.toDate?.()
        return ts && ts > yesterday
      }).length
      setNotifs(n => ({ ...n, notes: count }))
    }))

    unsubs.push(onSnapshot(doc(db, 'questions', TODAY), snap => {
      setNotifs(n => ({ ...n, question: !!(snap.exists() && snap.data()?.[otherQKey]) }))
    }))

    unsubs.push(onSnapshot(doc(db, 'snaps', TODAY), snap => {
      setNotifs(n => ({ ...n, snap: !!(snap.exists() && snap.data()?.[otherSnapKey]) }))
    }))

    unsubs.push(onSnapshot(doc(db, 'wyr', TODAY), snap => {
      setNotifs(n => ({ ...n, wyr: !!(snap.exists() && snap.data()?.[otherWyrKey]) }))
    }))

    return () => unsubs.forEach(u => u())
  }, [user])

  async function saveNextUp() {
    if (!editDate) return
    setSavingNextUp(true)
    await setDoc(doc(db, 'shared', 'nextup'), { date: editDate, location: editLocation })
    setSavingNextUp(false)
    setEditingNextUp(false)
  }

  function openEditNextUp() {
    setEditDate(nextDate.date || '')
    setEditLocation(nextDate.location || '')
    setEditingNextUp(true)
  }

  if (!mounted || loading || !user) return null

  const isHarry = user.email === HARRY_EMAIL

  // Show upcoming non-done reminders (with a date today or future, or recurring)
  const upcomingReminders = reminders.filter(r => {
    if (r.done) return false
    if (r.repeatType && r.repeatType !== 'none') return true
    if (r.date) return r.date >= TODAY
    return true
  }).slice(0, 3)

  const feedCards = [
    {
      href: '/question',
      icon: '🙋',
      iconBg: 'rgba(246,130,51,0.12)',
      title: 'Question of the day',
      sub: 'Tap to answer today\'s question',
      badge: notifs.question ? { dot: true } : undefined,
      badgeLabel: notifs.question ? (isHarry ? 'Nicole answered!' : 'Harry answered!') : 'Live',
      badgeStyle: notifs.question
        ? { backgroundColor: '#263322', color: '#F68233' }
        : { backgroundColor: '#F68233', color: '#263322' },
    },
    {
      href: '/wyr',
      icon: '🤔',
      iconBg: 'rgba(59,109,17,0.12)',
      title: 'Would you rather',
      sub: 'Today\'s dilemma',
      badge: notifs.wyr ? { dot: true } : undefined,
      badgeLabel: notifs.wyr ? (isHarry ? 'Nicole chose!' : 'Harry chose!') : undefined,
      badgeStyle: { backgroundColor: '#263322', color: '#F68233' },
    },
    {
      href: '/snap',
      icon: '📸',
      iconBg: 'rgba(246,130,51,0.12)',
      title: 'Daily snap',
      sub: 'Post and see each other\'s photo',
      badge: notifs.snap ? { dot: true } : undefined,
      badgeLabel: notifs.snap ? (isHarry ? 'Nicole posted!' : 'Harry posted!') : undefined,
      badgeStyle: { backgroundColor: '#263322', color: '#F68233' },
    },
    {
      href: '/wordgame',
      icon: '🔤',
      iconBg: 'rgba(59,109,17,0.12)',
      title: 'Word game',
      sub: 'Daily head-to-head',
      badgeLabel: 'New',
      badgeStyle: { backgroundColor: '#F68233', color: '#263322' },
    },
    {
      href: '/notes',
      icon: '💌',
      iconBg: 'rgba(59,109,17,0.12)',
      title: 'Love notes',
      sub: isHarry ? 'Leave Nicole a note' : 'Leave Harry a note',
      badge: notifs.notes > 0 ? { count: notifs.notes } : undefined,
      badgeLabel: undefined,
      badgeStyle: { backgroundColor: '#F68233', color: '#263322' },
    },
    {
      href: '/dates',
      icon: '📍',
      iconBg: 'rgba(246,130,51,0.12)',
      title: 'Date wishlist',
      sub: 'Ideas waiting for approval',
      badgeLabel: undefined,
      badgeStyle: {},
    },
    {
      href: '/more',
      icon: '✨',
      iconBg: 'rgba(246,130,51,0.12)',
      title: 'More',
      sub: 'Games, memories, bucket list & more',
      badgeLabel: undefined,
      badgeStyle: {},
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <img src="/logo.svg" alt="" style={{ width: '34px', height: '34px', borderRadius: '9px', display: 'block' }} />
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '21px', color: '#18181A', letterSpacing: '-0.3px', lineHeight: '1' }}>Haz <em style={{ color: '#F68233', fontStyle: 'italic' }}>&amp;</em> Nix</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2.5px solid #F7F5F1', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', zIndex: 2 }}>
              <img src="/harry-icon.svg" alt="Harry" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2.5px solid #F7F5F1', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', marginLeft: '-8px', zIndex: 1 }}>
              <img src="/nicole-icon.svg" alt="Nicole" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
          <button onClick={() => signOut(auth).then(() => router.push('/'))} style={{ fontSize: '12px', color: '#ADADB3', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Hero countdown */}
      <div style={{ margin: '16px', backgroundColor: '#1E2B1C', borderRadius: '20px', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
        {editingNextUp ? (
          <div>
            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6A9B63', marginBottom: '10px' }}>Edit next visit</div>
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: '#F0EDE6', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'system-ui', colorScheme: 'dark' }} />
            <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. Cambridge → Croydon" style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: '#F0EDE6', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', fontFamily: 'system-ui' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditingNextUp(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: '#6A9B63', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveNextUp} disabled={savingNextUp || !editDate} style={{ flex: 2, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', border: 'none', backgroundColor: '#F68233', color: '#263322', cursor: 'pointer', opacity: !editDate ? 0.5 : 1 }}>
                {savingNextUp ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6A9B63' }}>Next up</div>
              <button onClick={openEditNextUp} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6A9B63', display: 'flex', alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                {sleeps !== null ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontFamily: 'Georgia,serif', fontSize: '48px', color: '#F68233', lineHeight: '1', letterSpacing: '-2px' }}>{sleeps}</span>
                    <span style={{ fontSize: '13px', color: '#C3DFB9' }}>sleeps</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: '#6A9B63', paddingBottom: '4px' }}>Tap ✏️ to set your next date</div>
                )}
                {nextDate.date && (
                  <div style={{ fontSize: '11px', color: '#C3DFB9', marginTop: '4px' }}>
                    until {new Date(nextDate.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                )}
                {nextDate.location && (
                  <div style={{ fontSize: '10px', color: '#6A9B63', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#F68233', display: 'inline-block' }} />
                    {nextDate.location}
                  </div>
                )}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <svg width="40" height="40" viewBox="0 0 42 42" fill="none">
                  <path d="M21 36C21 36 5 26 5 15C5 10.3 8.8 6.5 13.5 6.5C16.3 6.5 18.8 7.9 20.4 10.1C20.7 10.5 21.3 10.5 21.6 10.1C23.2 7.9 25.7 6.5 28.5 6.5C33.2 6.5 37 10.3 37 15C37 26 21 36 21 36Z" fill="#F68233" opacity="0.85" />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '0 16px 14px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '10px', color: '#ADADB3', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Together</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', color: '#18181A', marginTop: '3px' }}>{daysTogether} <span style={{ fontSize: '12px', color: '#ADADB3', fontFamily: 'system-ui' }}>days</span></div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '10px', color: '#ADADB3', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Anniversary</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '26px', color: '#18181A', marginTop: '3px' }}>4 Sep <span style={{ fontSize: '12px', color: '#ADADB3', fontFamily: 'system-ui' }}>2025</span></div>
        </div>
      </div>

      {/* Reminders widget */}
      {upcomingReminders.length > 0 && (
        <div style={{ margin: '0 16px 14px', backgroundColor: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ADADB3' }}>Reminders</div>
            <button onClick={() => router.push('/reminders')} style={{ fontSize: '10px', color: '#F68233', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>See all</button>
          </div>
          {upcomingReminders.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: i > 0 ? '8px' : '0', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F68233', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#18181A' }}>{r.title}</div>
                {repeatLabel(r) && <div style={{ fontSize: '10px', color: '#ADADB3', marginTop: '1px' }}>{repeatLabel(r)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '100px' }}>
        {feedCards.map(card => (
          <div
            key={card.href}
            onClick={() => router.push(card.href)}
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{card.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#18181A' }}>{card.title}</div>
              <div style={{ fontSize: '11px', color: '#ADADB3', marginTop: '2px' }}>{card.sub}</div>
            </div>
            {card.badge?.count != null ? (
              <div style={{ minWidth: '20px', height: '20px', borderRadius: '10px', backgroundColor: '#F68233', color: '#263322', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0 }}>
                {card.badge.count}
              </div>
            ) : card.badgeLabel ? (
              <div style={{ fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '100px', flexShrink: 0, ...card.badgeStyle }}>
                {card.badgeLabel}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
