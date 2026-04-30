'use client'
import { useRouter } from 'next/navigation'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

export default function RemindersPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [recurring, setRecurring] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function addReminder() {
    if (!title.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'reminders'), {
      title: title.trim(),
      when: when.trim(),
      recurring: recurring.trim(),
      done: false,
      createdAt: serverTimestamp()
    })
    setTitle(''); setWhen(''); setRecurring(''); setAdding(false); setSaving(false)
  }

  async function toggleDone(id: string, current: boolean) {
    await updateDoc(doc(db, 'reminders', id), { done: !current })
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Reminders</h1>
        <button onClick={() => setAdding(true)} style={{marginLeft:'auto',fontSize:'12px',color:'#F68233',fontWeight:'600',background:'none',border:'none',cursor:'pointer'}}>+ Add</button>
      </div>

      <div style={{padding:'0 16px'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A',marginBottom:'12px'}}>New reminder</div>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What do you want to remember?" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box'}} />
            <input value={when} onChange={e=>setWhen(e.target.value)} placeholder="When? (e.g. Tonight, Sunday, 2 May)" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box'}} />
            <input value={recurring} onChange={e=>setRecurring(e.target.value)} placeholder="Recurring? (e.g. Weekly, Mon/Wed/Fri)" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'12px',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setAdding(false)} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={addReminder} disabled={saving||!title.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!title.trim()?0.5:1}}>{saving?'Saving...':'Save reminder'}</button>
            </div>
          </div>
        )}

        {reminders.length === 0 && !adding && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'40px'}}>No reminders yet</div>
        )}

        {reminders.map(rem => (
          <div key={rem.id} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'13px 15px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div onClick={() => toggleDone(rem.id, rem.done)} style={{width:'20px',height:'20px',borderRadius:'50%',border:rem.done?'none':'1.5px solid #E4E1DB',backgroundColor:rem.done?'#263322':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
              {rem.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:rem.done?'#ADADB3':'#18181A',textDecoration:rem.done?'line-through':'none'}}>{rem.title}</div>
              {(rem.when || rem.recurring) && <div style={{fontSize:'10px',color:'#ADADB3',marginTop:'3px'}}>{rem.recurring ? 'Recurring · '+rem.recurring : rem.when}</div>}
            </div>
            {rem.when && !rem.recurring && <div style={{fontSize:'10px',fontWeight:'600',padding:'3px 9px',borderRadius:'100px',backgroundColor:'rgba(246,130,51,0.12)',color:'#F68233',flexShrink:0,whiteSpace:'nowrap'}}>{rem.when}</div>}
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
