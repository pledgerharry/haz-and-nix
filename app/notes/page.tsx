'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function NotesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function sendNote() {
    if (!text.trim() || !user) return
    setSending(true)
    await addDoc(collection(db, 'notes'), {
      text: text.trim(),
      from: user.email,
      fromName: user.email === HARRY_EMAIL ? 'Harry' : 'Nicole',
      createdAt: serverTimestamp()
    })
    setText('')
    setSending(false)
  }

  const isHarry = user?.email === HARRY_EMAIL

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Love notes</h1>
      </div>
      <div style={{padding:'0 16px 16px'}}>
        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',color:'#ADADB3',marginBottom:'8px'}}>Leave {isHarry ? 'Nicole' : 'Harry'} a note</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write something nice..." style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',fontFamily:'system-ui',resize:'none',outline:'none',height:'76px',boxSizing:'border-box'}} />
          <button onClick={sendNote} disabled={sending || !text.trim()} style={{marginTop:'8px',width:'100%',backgroundColor:'#263322',color:'#F68233',border:'none',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'600',cursor:'pointer',opacity:sending||!text.trim()?0.5:1}}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
        <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.09em',textTransform:'uppercase',color:'#ADADB3',padding:'4px 2px 10px'}}>Recent notes</div>
        {notes.map(note => (
          <div key={note.id} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <div style={{width:'24px',height:'24px',borderRadius:'50%',backgroundColor:note.fromName==='Harry'?'#263322':'#F68233',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:note.fromName==='Harry'?'#F68233':'#263322',fontWeight:'600',flexShrink:0}}>{note.fromName?.[0]}</div>
              <div style={{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.07em',color:'#F68233'}}>From {note.fromName}</div>
            </div>
            <div style={{fontSize:'13px',color:'#18181A',lineHeight:'1.58',fontStyle:'italic'}}>"{note.text}"</div>
            <div style={{fontSize:'10px',color:'#ADADB3',marginTop:'6px'}}>{note.createdAt?.toDate?.()?.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) ?? 'Just now'}</div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
