'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context'
import { useRouter } from 'next/navigation'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [nextDate, setNextDate] = useState({ date: '2026-04-30', location: 'Cambridge → Croydon' })
  const [sleeps, setSleeps] = useState(0)
  const [daysTogether, setDaysTogether] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !loading && !user) router.push('/')
  }, [user, loading, router, mounted])

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'shared', 'nextup')
    getDoc(ref).then(snap => {
      if (snap.exists()) setNextDate(snap.data() as any)
    })
  }, [user])

  useEffect(() => {
    const start = new Date('2025-09-04')
    const today = new Date()
    today.setHours(0,0,0,0)
    setDaysTogether(Math.round((today.getTime() - start.getTime()) / 86400000))
    const next = new Date(nextDate.date)
    setSleeps(Math.max(0, Math.round((next.getTime() - today.getTime()) / 86400000)))
  }, [nextDate])

  if (!mounted || loading || !user) return null

  const isHarry = user.email === HARRY_EMAIL

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{padding:'52px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'38px',height:'38px',backgroundColor:'#263322',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 27C16 27 5 20 5 12.5C5 9.2 7.7 6.5 11 6.5C13 6.5 14.8 7.5 16 9C17.2 7.5 19 6.5 21 6.5C24.3 6.5 27 9.2 27 12.5C27 20 16 27 16 27Z" stroke="#F68233" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span style={{fontFamily:'Georgia,serif',fontSize:'20px',color:'#18181A'}}>Haz <em style={{color:'#F68233'}}>&amp;</em> Nix</span>
        </div>
        <button onClick={() => signOut(auth).then(() => router.push('/'))} style={{fontSize:'12px',color:'#ADADB3',background:'none',border:'none',cursor:'pointer'}}>
          Sign out
        </button>
      </div>

      {/* Hero countdown */}
      <div style={{margin:'16px',backgroundColor:'#1E2B1C',borderRadius:'20px',padding:'18px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'4px'}}>Next up</div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <div>
            <div style={{display:'flex',alignItems:'baseline',gap:'6px'}}>
              <span style={{fontFamily:'Georgia,serif',fontSize:'48px',color:'#F68233',lineHeight:'1',letterSpacing:'-2px'}}>{sleeps}</span>
              <span style={{fontSize:'13px',color:'#C3DFB9'}}>sleeps</span>
            </div>
            <div style={{fontSize:'11px',color:'#C3DFB9',marginTop:'4px'}}>until {new Date(nextDate.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
            <div style={{fontSize:'10px',color:'#6A9B63',marginTop:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
              <span style={{width:'4px',height:'4px',borderRadius:'50%',backgroundColor:'#F68233',display:'inline-block'}}></span>
              {nextDate.location}
            </div>
          </div>
          <div style={{marginLeft:'auto'}}>
            <svg width="40" height="40" viewBox="0 0 42 42" fill="none">
              <path d="M21 36C21 36 5 26 5 15C5 10.3 8.8 6.5 13.5 6.5C16.3 6.5 18.8 7.9 20.4 10.1C20.7 10.5 21.3 10.5 21.6 10.1C23.2 7.9 25.7 6.5 28.5 6.5C33.2 6.5 37 10.3 37 15C37 26 21 36 21 36Z" fill="#F68233" opacity="0.85"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',margin:'0 16px 14px'}}>
        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'12px 14px',border:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:'10px',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:'600'}}>Together</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'26px',color:'#18181A',marginTop:'3px'}}>{daysTogether} <span style={{fontSize:'12px',color:'#ADADB3',fontFamily:'system-ui'}}>days</span></div>
        </div>
        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'12px 14px',border:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:'10px',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:'600'}}>Anniversary</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'26px',color:'#18181A',marginTop:'3px'}}>18 Oct <span style={{fontSize:'12px',color:'#ADADB3',fontFamily:'system-ui'}}>2025</span></div>
        </div>
      </div>

      {/* Feed cards */}
      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'10px'}}>

        <div onClick={() => router.push('/question')} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'12px',backgroundColor:'rgba(246,130,51,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>🙋</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>Question of the day</div>
            <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>Tap to answer today's question</div>
          </div>
          <div style={{fontSize:'10px',fontWeight:'600',padding:'3px 9px',borderRadius:'100px',backgroundColor:'#F68233',color:'#263322',flexShrink:0}}>Live</div>
        </div>

        <div onClick={() => router.push('/wordgame')} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'12px',backgroundColor:'rgba(59,109,17,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>🔤</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>Word game</div>
            <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>Daily head-to-head</div>
          </div>
          <div style={{fontSize:'10px',fontWeight:'600',padding:'3px 9px',borderRadius:'100px',backgroundColor:'#F68233',color:'#263322',flexShrink:0}}>New</div>
        </div>

        <div onClick={() => router.push('/notes')} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'12px',backgroundColor:'rgba(59,109,17,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>💌</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>Love notes</div>
            <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>{isHarry ? 'Leave Nicole a note' : 'Leave Harry a note'}</div>
          </div>
        </div>

        <div onClick={() => router.push('/dates')} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'12px',backgroundColor:'rgba(246,130,51,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>📍</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>Date wishlist</div>
            <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>Ideas waiting for approval</div>
          </div>
        </div>

        <div onClick={() => router.push('/more')} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'12px',backgroundColor:'rgba(246,130,51,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>✨</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>More</div>
            <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>Games, memories, bucket list & more</div>
          </div>
        </div>

      </div>

      <div style={{height:'40px'}}></div>
    </div>
  )
}
