'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

const DEFAULT_INTERVIEW = {
  role: 'Chief Vibe Officer',
  company: 'Good Feelings Ltd',
  description: "Responsible for maintaining the general energy of the office. Core duties include approving snack drawer contents, ensuring all meetings end with a high-five, and developing the company's official nap schedule policy.",
  questions: [
    'Where do you see yourself vibing in five years?',
    'Describe a time you dramatically improved the energy in a difficult situation.',
    'How do you handle a room where the vibe is completely off?',
    "What's your philosophy on biscuits — plain or fancy?",
    'If you could add one thing to the office to improve morale, what would it be?',
  ],
}

export default function InterviewPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [interview, setInterview] = useState(DEFAULT_INTERVIEW)
  const [flipped, setFlipped] = useState(false)
  const [past, setPast] = useState<any[]>([])

  const isHarry = user?.email === HARRY_EMAIL
  const dayOfMonth = new Date().getDate()
  const defaultHarryIsInterviewer = dayOfMonth % 2 === 1
  const harryIsInterviewer = flipped ? !defaultHarryIsInterviewer : defaultHarryIsInterviewer
  const interviewer = harryIsInterviewer ? 'Harry' : 'Nicole'
  const candidate = harryIsInterviewer ? 'Nicole' : 'Harry'
  const myRole = (isHarry && harryIsInterviewer) || (!isHarry && !harryIsInterviewer) ? 'interviewer' : 'candidate'

  useEffect(() => {
    const docRef = doc(db, 'interview', TODAY)
    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.role) setInterview({
          role: data.role,
          company: data.company ?? 'Unnamed Co.',
          description: data.description ?? '',
          questions: data.questions ?? DEFAULT_INTERVIEW.questions,
        })
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const days: string[] = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    Promise.all(days.map(date => getDoc(doc(db, 'interview', date)))).then(snaps => {
      const results = snaps
        .map((snap, i) => snap.exists() ? { date: days[i], ...snap.data() } : null)
        .filter(Boolean)
      setPast(results as any[])
    })
  }, [])

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Interview mode</h1>
      </div>

      <div style={{padding:'0 16px'}}>
        <div style={{backgroundColor:'#1E2B1C',borderRadius:'20px',padding:'20px',marginBottom:'12px'}}>
          <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'8px'}}>Today's role</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'22px',color:'#F68233',marginBottom:'4px'}}>{interview.role}</div>
          <div style={{fontSize:'12px',color:'#C3DFB9',marginBottom:'12px'}}>{interview.company}</div>
          <div style={{fontSize:'13px',color:'#F0EDE6',lineHeight:'1.55',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>{interview.description}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
          {[
            { label: 'Interviewer', icon: '🎙', name: interviewer, active: myRole === 'interviewer' },
            { label: 'Candidate', icon: '👔', name: candidate, active: myRole === 'candidate' },
          ].map(({ label, icon, name, active }) => (
            <div key={label} style={{backgroundColor:active?'#263322':'#fff',borderRadius:'14px',padding:'12px 14px',border:'1px solid rgba(0,0,0,0.07)',textAlign:'center'}}>
              <div style={{fontSize:'18px',marginBottom:'4px'}}>{icon}</div>
              <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:active?'#6A9B63':'#ADADB3',marginBottom:'4px'}}>{label}</div>
              <div style={{fontSize:'14px',fontWeight:'600',color:active?'#F68233':'#18181A'}}>{name}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setFlipped(f => !f)} style={{width:'100%',backgroundColor:'#fff',color:'#18181A',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'12px',padding:'10px',fontSize:'12px',fontWeight:'600',cursor:'pointer',marginBottom:'14px'}}>
          ⇄ Swap roles
        </button>

        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'14px'}}>
          <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:'#ADADB3',marginBottom:'12px'}}>Interview questions</div>
          {interview.questions.map((q, i) => (
            <div key={i} style={{display:'flex',gap:'10px',marginBottom: i < interview.questions.length - 1 ? '10px' : '0',alignItems:'flex-start'}}>
              <div style={{width:'20px',height:'20px',borderRadius:'50%',backgroundColor:'rgba(246,130,51,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700',color:'#F68233',flexShrink:0,marginTop:'1px'}}>{i+1}</div>
              <div style={{fontSize:'13px',color:'#18181A',lineHeight:'1.45'}}>{q}</div>
            </div>
          ))}
        </div>

        {past.length > 0 && (
          <>
            <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.09em',textTransform:'uppercase',color:'#ADADB3',padding:'4px 2px 10px'}}>Past interviews</div>
            {past.map((p: any) => (
              <div key={p.date} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'12px 14px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px'}}>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#F68233'}}>{p.role}</div>
                <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>{p.company} · {new Date(p.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</div>
              </div>
            ))}
          </>
        )}
      </div>
      <Nav />
    </div>
  )
}
