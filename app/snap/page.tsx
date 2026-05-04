'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db, storage } from '../firebase'
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

export default function SnapPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [todaySnap, setTodaySnap] = useState<any>(null)
  const [past, setPast] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [showForm, setShowForm] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const isHarry = user?.email === HARRY_EMAIL
  const myUrlKey = isHarry ? 'harryUrl' : 'nicoleUrl'
  const myCaptionKey = isHarry ? 'harryCaption' : 'nicoleCaption'
  const otherUrlKey = isHarry ? 'nicoleUrl' : 'harryUrl'
  const otherCaptionKey = isHarry ? 'nicoleCaption' : 'harryCaption'
  const myName = isHarry ? 'Harry' : 'Nicole'
  const otherName = isHarry ? 'Nicole' : 'Harry'

  useEffect(() => {
    const snapDocRef = doc(db, 'snaps', TODAY)
    return onSnapshot(snapDocRef, snap => {
      setTodaySnap(snap.exists() ? snap.data() : null)
    })
  }, [user])

  useEffect(() => {
    const days: string[] = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    Promise.all(days.map(date => getDoc(doc(db, 'snaps', date)))).then(snaps => {
      const results = snaps
        .map((snap, i) => snap.exists() ? { date: days[i], ...snap.data() } : null)
        .filter(Boolean)
      setPast(results as any[])
    })
  }, [])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function uploadSnap() {
    if (!file || !user) return
    setUploading(true)
    try {
      const sRef = storageRef(storage, `snaps/${TODAY}_${user.uid}`)
      await uploadBytes(sRef, file)
      const url = await getDownloadURL(sRef)
      const snapDocRef = doc(db, 'snaps', TODAY)
      const existing = (await getDoc(snapDocRef)).data() ?? {}
      await setDoc(snapDocRef, { ...existing, [myUrlKey]: url, [myCaptionKey]: caption.trim(), date: TODAY })
      setFile(null)
      setPreview(null)
      setCaption('')
      setShowForm(false)
    } finally {
      setUploading(false)
    }
  }

  const mySnap = todaySnap?.[myUrlKey]
  const otherSnap = todaySnap?.[otherUrlKey]
  const bothPosted = !!(mySnap && otherSnap)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: '80px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <PageHeader title="Daily snap" right={!mySnap ? <button onClick={() => setShowForm(true)} style={{backgroundColor:'#263322',color:'#F68233',border:'none',borderRadius:'12px',padding:'8px 14px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>Post snap 📸</button> : undefined} />

      <div style={{padding:'0 16px'}}>
        <input ref={fileInput} type="file" accept="image/*,video/*" onChange={pickFile} style={{display:'none'}} />
        {showForm && !mySnap && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'14px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#18181A',marginBottom:'10px'}}>Post today's snap</div>
            {!preview ? (
              <div onClick={() => fileInput.current?.click()} style={{border:'2px dashed #E4E1DB',borderRadius:'12px',padding:'24px',textAlign:'center',cursor:'pointer',marginBottom:'10px',color:'#ADADB3',fontSize:'13px'}}>
                Tap to choose a photo or video
              </div>
            ) : (
              <div style={{marginBottom:'10px',borderRadius:'12px',overflow:'hidden',maxHeight:'200px'}}>
                {file?.type.startsWith('video/')
                  ? <video src={preview} controls style={{width:'100%',maxHeight:'200px',objectFit:'cover'}} />
                  : <img src={preview} alt="" style={{width:'100%',maxHeight:'200px',objectFit:'cover'}} />}
              </div>
            )}
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..." style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'10px',boxSizing:'border-box',fontFamily:'system-ui'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => { setShowForm(false); setPreview(null); setFile(null); setCaption('') }} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={uploadSnap} disabled={uploading || !file} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:uploading||!file?0.5:1}}>
                {uploading ? 'Uploading...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {!bothPosted && (mySnap || otherSnap) && (
          <div style={{ backgroundColor: 'rgba(246,130,51,0.1)', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', textAlign: 'center', fontSize: '12px', color: '#F68233', fontWeight: '500' }}>
            🔒 Snaps are blurred until both of you post
          </div>
        )}

        <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ADADB3', padding: '4px 2px 10px' }}>
          Today · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {([
            { name: myName, urlKey: myUrlKey, capKey: myCaptionKey, mine: true },
            { name: otherName, urlKey: otherUrlKey, capKey: otherCaptionKey, mine: false },
          ] as const).map(({ name, urlKey, capKey, mine }) => {
            const url = todaySnap?.[urlKey]
            const cap = todaySnap?.[capKey]
            return (
              <div key={name} style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/4', backgroundColor: '#E4E1DB', position: 'relative' }}>
                {url ? (
                  <>
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: bothPosted ? 'none' : 'blur(18px)',
                        transform: bothPosted ? 'none' : 'scale(1.15)',
                        transition: 'filter 0.4s ease, transform 0.4s ease',
                      }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: bothPosted ? 'linear-gradient(transparent 55%,rgba(0,0,0,0.65))' : 'rgba(0,0,0,0.1)' }}>
                      {bothPosted ? (
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{name}</div>
                          {cap && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '2px', fontStyle: 'italic' }}>"{cap}"</div>}
                        </div>
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🔒</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>{name} posted!</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '28px', opacity: 0.35 }}>📸</span>
                    <span style={{ fontSize: '11px', color: '#ADADB3', textAlign: 'center', lineHeight: '1.4' }}>
                      {mine ? "You haven't posted today" : `${name} hasn't posted yet`}
                    </span>
                    {mine && !showForm && (
                      <button onClick={() => setShowForm(true)} style={{ marginTop: '4px', backgroundColor: '#263322', color: '#F68233', border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {past.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ADADB3', padding: '4px 2px 10px' }}>Previous days</div>
            {past.map((p: any) => (
              <div key={p.date} style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ padding: '10px 14px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#ADADB3' }}>
                  {new Date(p.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                  {(['harryUrl', 'nicoleUrl'] as const).map((urlKey, ni) =>
                    p[urlKey] ? (
                      <div key={urlKey} style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
                        <img src={p[urlKey]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '6px', left: '7px', fontSize: '10px', fontWeight: '600', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{ni === 0 ? 'Harry' : 'Nicole'}</div>
                      </div>
                    ) : (
                      <div key={urlKey} style={{ aspectRatio: '1', backgroundColor: '#F7F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#ADADB3' }}>{ni === 0 ? 'Harry' : 'Nicole'} —</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <Nav />
    </div>
  )
}
