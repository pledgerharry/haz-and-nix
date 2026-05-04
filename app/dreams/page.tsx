'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function DreamsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dreams, setDreams] = useState<any[]>([])
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'dreams'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setDreams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function saveDream() {
    if (!text.trim() || !user) return
    setSaving(true)
    await addDoc(collection(db, 'dreams'), {
      dream: text.trim(),
      from: user.email,
      fromName: isHarry ? 'Harry' : 'Nicole',
      createdAt: serverTimestamp(),
    })
    setText('')
    setSaving(false)
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Dream log</h1>
      </div>

      <div style={{padding:'0 16px 16px'}}>
        <div style={{backgroundColor:'#1E2B1C',borderRadius:'16px',padding:'14px 16px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',color:'#6A9B63',marginBottom:'8px'}}>Log a dream</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What did you dream about?..."
            style={{width:'100%',backgroundColor:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#F0EDE6',fontFamily:'system-ui',resize:'none',outline:'none',height:'80px',boxSizing:'border-box'}}
          />
          <button
            onClick={saveDream}
            disabled={saving || !text.trim()}
            style={{marginTop:'8px',width:'100%',backgroundColor:'#F68233',color:'#263322',border:'none',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'600',cursor:'pointer',opacity:saving||!text.trim()?0.5:1}}
          >
            {saving ? 'Saving...' : 'Log dream'}
          </button>
        </div>

        {dreams.length === 0 && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'40px',lineHeight:'1.8'}}>
            <div style={{fontSize:'40px',marginBottom:'10px'}}>🌙</div>
            No dreams logged yet
          </div>
        )}

        {dreams.map(d => (
          <div key={d.id} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <div style={{width:'24px',height:'24px',borderRadius:'50%',backgroundColor:d.fromName==='Harry'?'#263322':'#F68233',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:d.fromName==='Harry'?'#F68233':'#263322',fontWeight:'600',flexShrink:0}}>{d.fromName?.[0]}</div>
              <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:'#ADADB3'}}>{d.fromName}'s dream</div>
            </div>
            <div style={{fontSize:'13px',color:'#18181A',lineHeight:'1.58'}}>🌙 {d.dream}</div>
            <div style={{fontSize:'10px',color:'#ADADB3',marginTop:'6px'}}>
              {d.createdAt?.toDate?.()?.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) ?? 'Just now'}
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
