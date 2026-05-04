'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

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
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'bucket'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, async snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setItems(docs)
      if (docs.length === 0 && !seeded) {
        setSeeded(true)
        for (const t of DEFAULTS) {
          await addDoc(collection(db, 'bucket'), { text: t, done: false, createdAt: serverTimestamp() })
        }
      }
    })
  }, [])

  function startAdd() {
    setText(''); setEditingId(null); setAdding(true)
  }

  function startEdit(item: any) {
    setText(item.text || ''); setEditingId(item.id); setAdding(true)
  }

  function cancelForm() {
    setAdding(false); setEditingId(null); setText('')
  }

  async function saveItem() {
    if (!text.trim()) return
    setSaving(true)
    if (editingId) {
      await updateDoc(doc(db, 'bucket', editingId), { text: text.trim() })
    } else {
      await addDoc(collection(db, 'bucket'), { text: text.trim(), done: false, createdAt: serverTimestamp() })
    }
    cancelForm(); setSaving(false)
  }

  async function toggleDone(id: string, current: boolean) {
    await updateDoc(doc(db, 'bucket', id), { done: !current })
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="Bucket list" right={
        <button onClick={startAdd} style={{fontSize:'12px',color:'#F68233',fontWeight:'600',background:'none',border:'none',cursor:'pointer'}}>+ Add</button>
      } />

      <div style={{padding:'12px 16px 0'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#18181A',marginBottom:'10px'}}>{editingId ? 'Edit item' : 'New item'}</div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add something to your bucket list..."
              autoFocus
              style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box',fontFamily:'system-ui'}}
            />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={cancelForm} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={saveItem} disabled={saving || !text.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!text.trim()?0.5:1}}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'13px 15px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div onClick={() => toggleDone(item.id, item.done)} style={{width:'20px',height:'20px',borderRadius:'50%',border:item.done?'none':'1.5px solid #E4E1DB',backgroundColor:item.done?'#263322':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
              {item.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div onClick={() => toggleDone(item.id, item.done)} style={{fontSize:'13px',color:item.done?'#ADADB3':'#18181A',textDecoration:item.done?'line-through':'none',flex:1,cursor:'pointer'}}>{item.text}</div>
            <button onClick={() => startEdit(item)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'#ADADB3',display:'flex',alignItems:'center',flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
