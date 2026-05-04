'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, collection, orderBy, query, getDocs, limit } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

const DEFAULT_WYR = {
  question: 'Would you rather only listen to one song forever, or never listen to music again?',
  optionA: 'One song forever 🎵',
  optionB: 'No music ever 🔇',
}

export default function WyrPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [wyr, setWyr] = useState(DEFAULT_WYR)
  const [myChoice, setMyChoice] = useState<'A' | 'B' | null>(null)
  const [otherChoice, setOtherChoice] = useState<'A' | 'B' | null>(null)
  const [saved, setSaved] = useState(false)
  const [bothAnswered, setBothAnswered] = useState(false)
  const [past, setPast] = useState<any[]>([])

  const isHarry = user?.email === HARRY_EMAIL
  const myKey = isHarry ? 'harryChoice' : 'nicoleChoice'
  const otherKey = isHarry ? 'nicoleChoice' : 'harryChoice'
  const myName = isHarry ? 'Harry' : 'Nicole'
  const otherName = isHarry ? 'Nicole' : 'Harry'

  useEffect(() => {
    const docRef = doc(db, 'wyr', TODAY)
    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.question) setWyr({ question: data.question, optionA: data.optionA, optionB: data.optionB })
        if (data[myKey]) { setMyChoice(data[myKey]); setSaved(true) }
        if (data[otherKey]) setOtherChoice(data[otherKey])
        if (data.harryChoice && data.nicoleChoice) setBothAnswered(true)
      }
    })
    return unsub
  }, [user])

  useEffect(() => {
    const days: string[] = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    Promise.all(days.map(date => getDoc(doc(db, 'wyr', date)))).then(snaps => {
      const results = snaps
        .map((snap, i) => snap.exists() ? { date: days[i], ...snap.data() } : null)
        .filter(Boolean)
      setPast(results as any[])
    })
  }, [])

  async function choose(choice: 'A' | 'B') {
    if (!user || saved) return
    const docRef = doc(db, 'wyr', TODAY)
    const snap = await getDoc(docRef)
    const existing = snap.exists() ? snap.data() : {}
    await setDoc(docRef, { ...existing, [myKey]: choice, date: TODAY, question: wyr.question, optionA: wyr.optionA, optionB: wyr.optionB })
    setMyChoice(choice)
    setSaved(true)
  }

  const btnBase: React.CSSProperties = {
    width: '100%', border: 'none', borderRadius: '16px', padding: '18px 20px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'system-ui',
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Would you rather</h1>
      </div>

      <div style={{padding:'0 16px'}}>
        <div style={{backgroundColor:'#1E2B1C',borderRadius:'20px',padding:'20px',marginBottom:'14px'}}>
          <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'10px'}}>
            {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'18px',color:'#F0EDE6',lineHeight:'1.45',fontStyle:'italic'}}>
            "{wyr.question}"
          </div>
        </div>

        {!saved ? (
          <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'14px'}}>
            <button onClick={() => choose('A')} style={{...btnBase,backgroundColor:'#F68233',color:'#fff'}}>
              <span style={{fontSize:'11px',opacity:0.7,display:'block',marginBottom:'4px',fontWeight:'400'}}>Option A</span>
              {wyr.optionA}
            </button>
            <button onClick={() => choose('B')} style={{...btnBase,backgroundColor:'#263322',color:'#F0EDE6'}}>
              <span style={{fontSize:'11px',opacity:0.7,display:'block',marginBottom:'4px',fontWeight:'400'}}>Option B</span>
              {wyr.optionB}
            </button>
          </div>
        ) : (
          <div style={{marginBottom:'14px'}}>
            <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px'}}>
              <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:'#ADADB3',marginBottom:'8px'}}>Your choice</div>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'28px',height:'28px',borderRadius:'50%',backgroundColor:'#F68233',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:'#fff',flexShrink:0}}>{myChoice}</div>
                <div style={{fontSize:'13px',color:'#18181A',fontWeight:'500'}}>{myChoice === 'A' ? wyr.optionA : wyr.optionB}</div>
              </div>
            </div>
            <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)'}}>
              <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:'#ADADB3',marginBottom:'8px'}}>{otherName}'s choice</div>
              {bothAnswered && otherChoice ? (
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',backgroundColor:'#263322',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:'#F68233',flexShrink:0}}>{otherChoice}</div>
                  <div style={{fontSize:'13px',color:'#18181A',fontWeight:'500'}}>{otherChoice === 'A' ? wyr.optionA : wyr.optionB}</div>
                </div>
              ) : (
                <div style={{backgroundColor:'#F7F5F1',borderRadius:'11px',padding:'12px',fontSize:'12px',color:'#ADADB3',textAlign:'center',fontStyle:'italic'}}>
                  Waiting for {otherName} to pick ✨
                </div>
              )}
            </div>
            {bothAnswered && myChoice === otherChoice && (
              <div style={{backgroundColor:'rgba(246,130,51,0.1)',borderRadius:'12px',padding:'10px 14px',marginTop:'8px',textAlign:'center',fontSize:'12px',color:'#F68233',fontWeight:'600'}}>
                You both chose the same thing! 🎉
              </div>
            )}
          </div>
        )}

        {past.length > 0 && (
          <>
            <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.09em',textTransform:'uppercase',color:'#ADADB3',padding:'4px 2px 10px'}}>Previous</div>
            {past.map((p: any) => (
              <div key={p.date} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'12px 14px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px'}}>
                <div style={{fontSize:'10px',color:'#ADADB3',marginBottom:'6px'}}>{new Date(p.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</div>
                <div style={{fontSize:'12px',color:'#18181A',fontStyle:'italic',marginBottom:'6px'}}>"{p.question}"</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap' as const}}>
                  {p.harryChoice && <span style={{fontSize:'11px',color:'#ADADB3'}}>Harry: {p.harryChoice === 'A' ? p.optionA : p.optionB}</span>}
                  {p.nicoleChoice && <span style={{fontSize:'11px',color:'#ADADB3'}}>· Nicole: {p.nicoleChoice === 'A' ? p.optionA : p.optionB}</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <Nav />
    </div>
  )
}
