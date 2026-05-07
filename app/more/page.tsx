'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const TODAY = new Date().toISOString().split('T')[0]

export default function MorePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [goalsDone, setGoalsDone] = useState(0)
  const [goalsTotal, setGoalsTotal] = useState(0)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'goalItems'), orderBy('createdAt', 'asc'))
    const unsub1 = onSnapshot(q, snap => setGoalsTotal(snap.docs.length))
    const unsub2 = onSnapshot(doc(db, 'goalCompletions', TODAY), snap => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, { harry?: boolean; nicole?: boolean }>
        setGoalsDone(Object.values(data).filter(v => v.harry && v.nicole).length)
      } else {
        setGoalsDone(0)
      }
    })
    return () => { unsub1(); unsub2() }
  }, [user])

  const games = [
    { href: '/wordgame', icon: '🔤', title: 'Word game', sub: 'Daily head-to-head' },
    { href: '/wyr', icon: '🤔', title: 'Would you rather', sub: 'New question ready' },
    { href: '/interview', icon: '📋', title: 'Interview mode', sub: 'Silly job interviews' },
  ]

  const goalsSub = goalsTotal > 0 ? `${goalsDone}/${goalsTotal} done today` : 'Track shared daily goals'

  const us = [
    { href: '/goals', icon: '🎯', title: 'Daily goals', sub: goalsSub },
    { href: '/stats', icon: '📊', title: 'Relationship stats', sub: 'Days together and more' },
    { href: '/bucket', icon: '✅', title: 'Bucket list', sub: 'Things to do together' },
    { href: '/countries', icon: '🌍', title: 'Countries', sub: 'Places we want to visit' },
    { href: '/memories', icon: '🖼️', title: 'Memories', sub: 'Photos and videos' },
    { href: '/dreams', icon: '🌙', title: 'Dream log', sub: 'Shared dreams' },
    { href: '/reminders', icon: '🔔', title: 'Reminders', sub: 'Shared reminders' },
  ]

  const watchlist = [
    { href: '/movies', icon: '🎬', title: 'Movie wishlist', sub: '34 films to watch' },
  ]

  const Row = ({ href, icon, title, sub }: any) => (
    <div onClick={() => router.push(href)} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'13px 14px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',marginBottom:'7px',border:'1px solid rgba(0,0,0,0.07)'}}>
      <div style={{width:'34px',height:'34px',borderRadius:'10px',backgroundColor:'rgba(246,130,51,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>{title}</div>
        <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>{sub}</div>
      </div>
      <span style={{color:'#ADADB3',fontSize:'18px'}}>›</span>
    </div>
  )

  const SectionLabel = ({ label }: any) => (
    <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.09em',textTransform:'uppercase',color:'#ADADB3',padding:'4px 2px 6px'}}>{label}</div>
  )

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="More" showBack={false} />
      <div style={{padding:'12px 16px 0'}}>
        <SectionLabel label="🎮 Games & fun" />
        {games.map(g => <Row key={g.href} {...g} />)}
        <SectionLabel label="💑 Us" />
        {us.map(g => <Row key={g.href} {...g} />)}
        <SectionLabel label="🎬 Watchlist" />
        {watchlist.map(g => <Row key={g.href} {...g} />)}
      </div>
      <Nav />
    </div>
  )
}
