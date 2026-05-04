'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

const SEED_MOVIES = [
  'Scarface', 'Children of Men', 'Slumdog Millionaire', 'Zootopia 2', 'Perfect Days',
  'Die Hard', 'District 9', '12 Angry Men', 'Requiem for a Dream', 'Us',
  'Dune Part One', 'Dune Part Two', 'The Usual Suspects', 'The Last Black Man in San Francisco',
  'Grey Gardens', 'The Roses', 'Logan', 'Alien', 'Some Like It Hot', 'The Pianist',
  'The Good The Bad and the Ugly', 'Snatch', 'Paris Texas', 'Juror 2', 'Sentimental Value',
  'If Beale Street Could Talk', 'Killers of the Flower Moon', 'Oldboy', 'Train Dreams',
  'Heat', 'Caught Stealing', 'Apocalypse Now', 'I Was a Stranger',
]

export default function MoviesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [movies, setMovies] = useState<any[]>([])
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [tab, setTab] = useState<'towatch' | 'watched'>('towatch')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const seededRef = useRef(false)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setMovies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setInitialLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!user || !initialLoaded || movies.length > 0 || seededRef.current) return
    seededRef.current = true
    SEED_MOVIES.forEach((t, i) =>
      addDoc(collection(db, 'movies'), {
        title: t,
        addedBy: 'seed',
        addedByName: 'Harry & Nicole',
        watched: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000) + i, nanoseconds: 0 },
        order: i,
      })
    )
  }, [user, initialLoaded, movies.length])

  async function addMovie() {
    if (!title.trim() || !user) return
    setSaving(true)
    await addDoc(collection(db, 'movies'), {
      title: title.trim(),
      addedBy: user.email,
      addedByName: isHarry ? 'Harry' : 'Nicole',
      watched: false,
      createdAt: serverTimestamp(),
    })
    setTitle('')
    setAdding(false)
    setSaving(false)
  }

  async function saveEditTitle() {
    if (!editTitle.trim() || !editingId) return
    await updateDoc(doc(db, 'movies', editingId), { title: editTitle.trim() })
    setEditingId(null); setEditTitle('')
  }

  async function markWatched(id: string) {
    await updateDoc(doc(db, 'movies', id), { watched: true, watchedAt: serverTimestamp() })
  }

  async function setRating(id: string, rating: number) {
    await updateDoc(doc(db, 'movies', id), { rating })
  }

  const list = movies.filter(m => tab === 'towatch' ? !m.watched : m.watched)
  const unwatchedCount = movies.filter(m => !m.watched).length
  const watchedCount = movies.filter(m => m.watched).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <PageHeader title="Movie wishlist" right={<button onClick={() => setAdding(a => !a)} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#263322',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#F68233',fontSize:'22px',fontWeight:'300',lineHeight:'1'}}>+</button>} />

      <div style={{padding:'0 16px'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'14px'}}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Movie title..." autoFocus style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'8px',boxSizing:'border-box',fontFamily:'system-ui'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setAdding(false)} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={addMovie} disabled={saving||!title.trim()} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:saving||!title.trim()?0.5:1}}>
                {saving ? 'Adding...' : 'Add movie'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', backgroundColor: '#E4E1DB', borderRadius: '12px', padding: '3px', marginBottom: '14px' }}>
          {(['towatch', 'watched'] as const).map((val) => {
            const label = val === 'towatch' ? 'To watch' : 'Watched'
            const count = val === 'towatch' ? unwatchedCount : watchedCount
            return (
              <button key={val} onClick={() => setTab(val)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: tab === val ? '#263322' : 'transparent', color: tab === val ? '#F68233' : '#ADADB3' }}>
                {label} ({count})
              </button>
            )
          })}
        </div>

        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: '#ADADB3', fontSize: '14px', marginTop: '40px', lineHeight: '1.8' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎬</div>
            {tab === 'towatch' ? 'Nothing on the list yet!' : 'Nothing watched yet'}
          </div>
        )}

        {list.map(m => (
          <div key={m.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '13px 14px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '8px' }}>
            {editingId === m.id ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEditTitle(); if (e.key === 'Escape') { setEditingId(null); setEditTitle('') } }} autoFocus style={{ flex: 1, backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB', borderRadius: '10px', padding: '8px 10px', fontSize: '13px', color: '#18181A', outline: 'none', fontFamily: 'system-ui' }} />
                <button onClick={saveEditTitle} style={{ padding: '8px 12px', backgroundColor: '#263322', color: '#F68233', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setEditingId(null); setEditTitle('') }} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ADADB3', fontSize: '16px' }}>×</button>
              </div>
            ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: m.watched ? 'rgba(38,51,34,0.1)' : 'rgba(246,130,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>🎬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#18181A', textDecoration: m.watched ? 'line-through' : 'none', opacity: m.watched ? 0.55 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                <div style={{ fontSize: '10px', color: '#ADADB3', marginTop: '2px' }}>Added by {m.addedByName}</div>
              </div>
              {!m.watched && (
                <button onClick={() => { setEditingId(m.id); setEditTitle(m.title) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ADADB3', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
              {!m.watched && (
                <button onClick={() => markWatched(m.id)} style={{ padding: '5px 10px', backgroundColor: '#263322', color: '#F68233', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  Watched ✓
                </button>
              )}
            </div>
            )}
            {m.watched && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#ADADB3', marginRight: '4px' }}>Rating:</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(m.id, star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', padding: '0', lineHeight: '1', opacity: (m.rating ?? 0) >= star ? 1 : 0.2 }}>⭐</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
