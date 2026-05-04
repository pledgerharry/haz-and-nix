'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

const DEFAULTS = [
  'Go abroad together ✈️',
  'Cook a proper meal together from scratch 🍳',
  'Camp somewhere with proper stars 🌌',
  'See a show in the West End 🎭',
  'Visit somewhere neither of us has been 🗺️',
  'Go on a really long walk together 🥾',
  'See live music together 🎵',
  'Go on a spontaneous day trip 🚂',
]

export default function BucketPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'bucket'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setItems(docs)
      if (docs.length === 0 && !seeded) {
        setSeeded(true)
        for (const t of DEFAULTS) {
          await addDoc(collection(db, 'bucket'), { text: t, done: false, createdAt: serverTimestamp() })
        }
      }
    })
    return unsub
  }, [])

  async function addItem() {
    if (!text.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'bucket'), { text: text.trim(), done: false, createdAt: serverTimestamp() })
    setText(''); setAdding(false); setSaving(false)
  }

  async function toggleDone(id: string, current: boolean) {
    await updateDoc(doc(db, 'bucket', id), { done: !current })
  }

  const remaining = items.filter(i => !i.done).length

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Bucket list</h1>
          <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'1px'}}>{remaining} things left to do</div>
        </div>
        <button onClick={() => setAdding(true)} style={{marginLeft:'auto',fontSize:'12px',color:'#F68233',fontWeight:'600',background:'none',border:'none',cursor:'pointer'}}>+ Add</button>
      </div>

      <div style={{padding:'0 16px'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add something to your bucket list..." style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setAdding(false)} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={addItem} disabled={saving||!text.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!text.trim()?0.5:1}}>Add</button>
            </div>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} onClick={() => toggleDone(item.id, item.done)} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'13px 15px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer'}}>
            <div style={{width:'20px',height:'20px',borderRadius:'50%',border:item.done?'none':'1.5px solid #E4E1DB',backgroundColor:item.done?'#263322':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {item.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div style={{fontSize:'13px',color:item.done?'#ADADB3':'#18181A',textDecoration:item.done?'line-through':'none',flex:1}}>{item.text}</div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
