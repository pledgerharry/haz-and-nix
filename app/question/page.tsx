'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

const TODAY = new Date().toISOString().split('T')[0]

const DEFAULT_QUESTION = "If you could only eat one cuisine forever, what would it be and why?"
const DEFAULT_FACT = "🧠 The average person makes about 35,000 decisions a day — most of them about food."

export default function QuestionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isHarry = user?.email === HARRY_EMAIL
  const myKey = isHarry ? 'harryAnswer' : 'nicoleAnswer'
  const otherKey = isHarry ? 'nicoleAnswer' : 'harryAnswer'
  const otherName = isHarry ? 'Nicole' : 'Harry'

  const [question, setQuestion] = useState(DEFAULT_QUESTION)
  const [fact, setFact] = useState(DEFAULT_FACT)
  const [myAnswer, setMyAnswer] = useState('')
  const [otherAnswer, setOtherAnswer] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bothAnswered, setBothAnswered] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'questions', TODAY)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.question) setQuestion(data.question)
        if (data.fact) setFact(data.fact)
        if (data[myKey]) { setMyAnswer(data[myKey]); setSaved(true) }
        if (data[otherKey]) setOtherAnswer(data[otherKey])
        if (data.harryAnswer && data.nicoleAnswer) setBothAnswered(true)
      }
    })
    return unsub
  }, [user])

  async function saveAnswer() {
    if (!myAnswer.trim() || !user) return
    setSaving(true)
    const ref = doc(db, 'questions', TODAY)
    const snap = await getDoc(ref)
    const existing = snap.exists() ? snap.data() : {}
    await setDoc(ref, { ...existing, [myKey]: myAnswer.trim(), question, date: TODAY })
    setSaved(true)
    setSaving(false)
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="Question of the day" />

      <div style={{padding:'0 16px'}}>
        <div style={{backgroundColor:'#1E2B1C',borderRadius:'20px',padding:'20px',marginBottom:'14px',textAlign:'center'}}>
          <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6A9B63',marginBottom:'10px'}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'19px',color:'#F0EDE6',lineHeight:'1.38',fontStyle:'italic'}}>"{question}"</div>
          <div style={{marginTop:'13px',paddingTop:'13px',borderTop:'1px solid rgba(255,255,255,0.08)',fontSize:'11px',color:'#6A9B63',lineHeight:'1.55'}}>{fact}</div>
        </div>

        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'10px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>Your answer</div>
          {saved ? (
            <div style={{fontSize:'13px',color:'#18181A',lineHeight:'1.5',fontStyle:'italic'}}>"{myAnswer}"</div>
          ) : (
            <>
              <textarea value={myAnswer} onChange={e => setMyAnswer(e.target.value)} placeholder="Write your answer..." style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',fontFamily:'system-ui',resize:'none',outline:'none',height:'80px',boxSizing:'border-box'}} />
              <button onClick={saveAnswer} disabled={saving||!myAnswer.trim()} style={{marginTop:'8px',width:'100%',backgroundColor:'#263322',color:'#F68233',border:'none',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'600',cursor:'pointer',opacity:saving||!myAnswer.trim()?0.5:1}}>{saving?'Saving...':'Save my answer'}</button>
            </>
          )}
        </div>

        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>{otherName}'s answer</div>
          {bothAnswered && otherAnswer ? (
            <div style={{fontSize:'13px',color:'#18181A',lineHeight:'1.5',fontStyle:'italic'}}>"{otherAnswer}"</div>
          ) : (
            <div style={{backgroundColor:'#F7F5F1',borderRadius:'11px',padding:'12px',fontSize:'12px',color:'#ADADB3',textAlign:'center',fontStyle:'italic'}}>{saved ? `${otherName} hasn't answered yet — their answer will appear here once they do ✨` : 'Save your answer first to see when ' + otherName + ' replies'}</div>
          )}
        </div>
      </div>
      <Nav />
    </div>
  )
}
