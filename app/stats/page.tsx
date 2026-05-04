'use client'
import { db } from '../firebase'
import { collection, getCountFromServer } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const Stat = ({ label, value, sub }: { label: string; value: number; sub: string }) => (
  <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',textAlign:'center'}}>
    <div style={{fontFamily:'Georgia,serif',fontSize:'32px',color:'#F68233',lineHeight:'1'}}>{value}</div>
    <div style={{fontSize:'11px',fontWeight:'600',color:'#18181A',marginTop:'6px'}}>{label}</div>
    <div style={{fontSize:'10px',color:'#ADADB3',marginTop:'2px'}}>{sub}</div>
  </div>
)

export default function StatsPage() {
  const [stats, setStats] = useState({ notes: 0, dates: 0, bucket: 0, reminders: 0 })

  const start = new Date('2025-09-04')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysTogether = Math.round((today.getTime() - start.getTime()) / 86400000)

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

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="Stats" />

      <div style={{padding:'12px 16px 0',display:'flex',flexDirection:'column',gap:'10px'}}>
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
