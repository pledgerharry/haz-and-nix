'use client'
import { useRouter } from 'next/navigation'
import { db } from '../firebase'
import { collection, getCountFromServer } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ notes: 0, dates: 0, bucket: 0, reminders: 0 })

  const start = new Date('2025-09-04')
  const today = new Date()
  today.setHours(0,0,0,0)
  const daysTogether = Math.round((today.getTime() - start.getTime()) / 86400000)

  const anniv = new Date('2025-10-18')
  const nextAnniv = new Date('2026-10-18')
  const daysToAnniv = Math.round((nextAnniv.getTime() - today.getTime()) / 86400000)

  useEffect(() => {
    async function load() {
      const [notes, dates, bucket, reminders] = await Promise.all([
        getCountFromServer(collection(db, 'notes')),
        getCountFromServer(collection(db, 'dates')),
        getCountFromServer(collection(db, 'bucket')),
        getCountFromServer(collection(db, 'reminders')),
      ])
      setStats({ notes: notes.data().count, dates: dates.data().count, bucket: bucket.data().count, reminders: reminders.data().count })
    }
    load()
  }, [])

  const Stat = ({ label, value, sub }: any) => (
    <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 15px',border:'1px solid rgba(0,0,0,0.07)'}}>
      <div style={{fontSize:'10px',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:'600',marginBottom:'4px'}}>{label}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:'30px',color:'#18181A'}}>{value}</div>
      {sub && <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>{sub}</div>}
    </div>
  )

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Stats</h1>
      </div>

      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        <div style={{backgroundColor:'#1E2B1C',borderRadius:'20px',padding:'18px 20px'}}>
          <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'4px'}}>Days together</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'52px',color:'#F68233',lineHeight:'1',letterSpacing:'-2px'}}>{daysTogether}</div>
          <div style={{fontSize:'12px',color:'#C3DFB9',marginTop:'4px'}}>Since 4 September 2025 💚</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <Stat label="Love notes" value={stats.notes} sub="Sent between you" />
          <Stat label="Date ideas" value={stats.dates} sub="Added to wishlist" />
          <Stat label="Bucket list" value={stats.bucket} sub="Goals together" />
          <Stat label="Reminders" value={stats.reminders} sub="Set together" />
        </div>

        <div style={{backgroundColor:'#1E2B1C',borderRadius:'18px',padding:'18px 20px'}}>
          <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'4px'}}>Next anniversary</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'28px',color:'#F68233'}}>18 Oct 2026</div>
          <div style={{fontSize:'12px',color:'#C3DFB9',marginTop:'4px'}}>{daysToAnniv} days away</div>
        </div>
      </div>
      <Nav />
    </div>
  )
}
