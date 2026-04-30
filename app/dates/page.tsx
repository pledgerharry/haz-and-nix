'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function DatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dates, setDates] = useState<any[]>([])
  const [tab, setTab] = useState<'pending'|'approved'|'done'>('pending')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'dates'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setDates(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function addDate() {
    if (!title.trim() || !user) return
    setSaving(true)
    await addDoc(collection(db, 'dates'), {
      title: title.trim(),
      location: location.trim(),
      desc: desc.trim(),
      addedBy: isHarry ? 'Harry' : 'Nicole',
      status: 'pending',
      createdAt: serverTimestamp()
    })
    setTitle(''); setLocation(''); setDesc(''); setAdding(false); setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await updateDoc(doc(db, 'dates', id), { status })
  }

  const filtered = dates.filter(d => d.status === tab)

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Date wishlist</h1>
      </div>

      <div style={{display:'flex',gap:'6px',padding:'0 16px 12px',overflowX:'auto'}}>
        {(['pending','approved','done'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{borderRadius:'100px',padding:'6px 14px',fontSize:'12px',fontWeight:'500',whiteSpace:'nowrap',cursor:'pointer',border:'none',backgroundColor:tab===t?'#F68233':'#E4E1DB',color:tab===t?'#263322':'#6B6B6E'}}>
            {t.charAt(0).toUpperCase()+t.slice(1)} ({dates.filter(d=>d.status===t).length})
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {filtered.length === 0 && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'40px'}}>No {tab} dates yet</div>
        )}
        {filtered.map(date => (
          <div key={date.id} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
              <div>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#18181A'}}>{date.title}</div>
                {date.location && <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'3px'}}>📍 {date.location} · Added by {date.addedBy}</div>}
              </div>
              <div style={{fontSize:'10px',fontWeight:'600',padding:'3px 9px',borderRadius:'100px',backgroundColor:'#F68233',color:'#263322',flexShrink:0,whiteSpace:'nowrap'}}>{date.status}</div>
            </div>
            {date.desc && <div style={{fontSize:'12px',color:'#6B6B6E',lineHeight:'1.55',marginTop:'8px'}}>{date.desc}</div>}
            {date.status === 'pending' && (
              <div style={{display:'flex',gap:'7px',marginTop:'11px'}}>
                <button onClick={() => updateStatus(date.id,'done')} style={{flex:1,padding:'9px',borderRadius:'11px',fontSize:'12px',fontWeight:'500',border:'1.5px solid #E4E1DB',cursor:'pointer',backgroundColor:'transparent',color:'#6B6B6E'}}>Decline</button>
                <button onClick={() => updateStatus(date.id,'approved')} style={{flex:1,padding:'9px',borderRadius:'11px',fontSize:'12px',fontWeight:'500',border:'none',cursor:'pointer',backgroundColor:'rgba(59,109,17,0.12)',color:'#3B6D11'}}>✓ Approve</button>
              </div>
            )}
            {date.status === 'approved' && (
              <button onClick={() => updateStatus(date.id,'done')} style={{marginTop:'10px',width:'100%',padding:'9px',borderRadius:'11px',fontSize:'12px',fontWeight:'500',border:'none',cursor:'pointer',backgroundColor:'#263322',color:'#F68233'}}>Mark as done ✓</button>
            )}
          </div>
        ))}

        <div style={{height:'16px'}}></div>

        {adding ? (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A',marginBottom:'12px'}}>Add a date idea</div>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What's the idea?" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box'}} />
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location (Cambridge, London...)" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box'}} />
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Tell them a bit more (optional)" style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'12px',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setAdding(false)} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={addDate} disabled={saving||!title.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!title.trim()?0.5:1}}>{saving?'Adding...':'Add idea'}</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setAdding(true)} style={{width:'100%',backgroundColor:'#F68233',color:'#263322',border:'none',borderRadius:'14px',padding:'14px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>＋ Add a date idea</button>
        )}
      </div>
      <Nav />
    </div>
  )
}
