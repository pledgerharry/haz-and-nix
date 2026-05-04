'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

const inp: React.CSSProperties = {
  width: '100%', backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB',
  borderRadius: '11px', padding: '10px 12px', fontSize: '13px', color: '#18181A',
  outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'system-ui',
}

const SUGGESTIONS = [
  'Mini golf 🏌️','Picnic in the park 🧺','Cooking class 👨‍🍳','Wine tasting 🍷',
  'Cinema & dinner 🎬','Day trip to the coast 🌊','Escape room 🔐','Pottery class 🏺',
  'Botanical gardens 🌿','Comedy night 😂','Stargazing picnic 🌟','Museum day 🏛️',
  'Spa day 🧖','Farmers market 🥕','Board game café 🎲','Ice skating ⛸️',
  'Kayaking 🚣','Street food market 🌮','Drive-in movie 🚗','Art gallery + cocktails 🎨',
  'Bowling 🎳','Sunrise hike 🌄','Afternoon tea ☕','Go-karting 🏎️',
  'Axe throwing 🪓','Gin distillery tour 🫙','Live jazz night 🎷','Pottery painting 🎨',
]

export default function DatesPage() {
  const { user } = useAuth()
  const [dates, setDates] = useState<any[]>([])
  const [tab, setTab] = useState<'pending'|'approved'|'done'>('pending')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'dates'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setDates(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  function startAdd() {
    setTitle(''); setLocation(''); setDesc(''); setEditingId(null); setAdding(true)
  }

  function startEdit(date: any) {
    setTitle(date.title || ''); setLocation(date.location || ''); setDesc(date.desc || '')
    setEditingId(date.id); setAdding(true)
  }

  function cancelForm() {
    setAdding(false); setEditingId(null); setTitle(''); setLocation(''); setDesc('')
  }

  async function saveDate() {
    if (!title.trim() || !user) return
    setSaving(true)
    if (editingId) {
      await updateDoc(doc(db, 'dates', editingId), { title: title.trim(), location: location.trim(), desc: desc.trim() })
    } else {
      await addDoc(collection(db, 'dates'), {
        title: title.trim(), location: location.trim(), desc: desc.trim(),
        addedBy: isHarry ? 'Harry' : 'Nicole', status: 'pending', createdAt: serverTimestamp()
      })
    }
    cancelForm(); setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await updateDoc(doc(db, 'dates', id), { status })
  }

  const filtered = dates.filter(d => d.status === tab)

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="Date wishlist" right={
        <button onClick={startAdd} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#263322',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#F68233',fontSize:'22px',fontWeight:'300',lineHeight:'1'}}>+</button>
      } />

      <div style={{display:'flex',gap:'6px',padding:'0 16px 12px',overflowX:'auto'}}>
        {(['pending','approved','done'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{borderRadius:'100px',padding:'6px 14px',fontSize:'12px',fontWeight:'500',whiteSpace:'nowrap',cursor:'pointer',border:'none',backgroundColor:tab===t?'#F68233':'#E4E1DB',color:tab===t?'#263322':'#6B6B6E'}}>
            {t.charAt(0).toUpperCase()+t.slice(1)} ({dates.filter(d=>d.status===t).length})
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#18181A',marginBottom:'10px'}}>{editingId ? 'Edit date idea' : 'Add a date idea'}</div>

            {!editingId && (
              <>
                <div style={{fontSize:'11px',color:'#ADADB3',marginBottom:'7px'}}>Suggestions</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setTitle(s)} style={{padding:'5px 10px',borderRadius:'100px',fontSize:'11px',fontWeight:'500',border:'none',cursor:'pointer',backgroundColor:title===s?'#263322':'#F7F5F1',color:title===s?'#F68233':'#6B6B6E',whiteSpace:'nowrap'}}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the idea?" style={inp} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (Cambridge, London...)" style={inp} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tell them a bit more (optional)" style={{...inp, marginBottom:'12px'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={cancelForm} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={saveDate} disabled={saving||!title.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!title.trim()?0.5:1}}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add idea'}
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !adding && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'40px'}}>No {tab} dates yet</div>
        )}

        {filtered.map(date => (
          <div key={date.id} style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#18181A'}}>{date.title}</div>
                {date.location && <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'3px'}}>📍 {date.location} · Added by {date.addedBy}</div>}
              </div>
              <button onClick={() => startEdit(date)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 6px',color:'#ADADB3',display:'flex',alignItems:'center',flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
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
      </div>
      <Nav />
    </div>
  )
}
