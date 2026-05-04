'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function MemoriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [memories, setMemories] = useState<any[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [adding, setAdding] = useState(false)
  const [lightbox, setLightbox] = useState<any | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function upload() {
    if (!file || !user) return
    setUploading(true)
    try {
      const sRef = storageRef(storage, `memories/${Date.now()}_${user.uid}`)
      await uploadBytes(sRef, file)
      const url = await getDownloadURL(sRef)
      await addDoc(collection(db, 'memories'), {
        url,
        caption: caption.trim(),
        from: user.email,
        fromName: isHarry ? 'Harry' : 'Nicole',
        createdAt: serverTimestamp(),
      })
      setCaption('')
      setFile(null)
      setPreview(null)
      setAdding(false)
    } finally {
      setUploading(false)
    }
  }

  function cancelAdd() {
    setAdding(false)
    setPreview(null)
    setFile(null)
    setCaption('')
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <img src={lightbox.url} alt="" style={{maxWidth:'100%',maxHeight:'72vh',borderRadius:'12px',objectFit:'contain'}} />
          {lightbox.caption && <div style={{color:'#F0EDE6',fontSize:'14px',marginTop:'14px',textAlign:'center',fontStyle:'italic'}}>"{lightbox.caption}"</div>}
          <div style={{color:'#6A9B63',fontSize:'11px',marginTop:'8px'}}>{lightbox.fromName} · {lightbox.createdAt?.toDate?.()?.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
      )}

      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Memories</h1>
        </div>
        <button onClick={() => setAdding(true)} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#263322',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#F68233',fontSize:'22px',fontWeight:'300',lineHeight:'1'}}>+</button>
      </div>

      <div style={{padding:'0 16px'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'14px'}}>
            <div style={{fontSize:'11px',color:'#ADADB3',marginBottom:'10px'}}>Add a memory</div>
            <input type="file" accept="image/*,video/*" ref={fileInput} onChange={pickFile} style={{display:'none'}} />
            {preview ? (
              <img src={preview} alt="" style={{width:'100%',height:'200px',objectFit:'cover',borderRadius:'10px',marginBottom:'10px'}} />
            ) : (
              <div onClick={() => fileInput.current?.click()} style={{width:'100%',height:'160px',backgroundColor:'#F7F5F1',borderRadius:'10px',border:'1.5px dashed #E4E1DB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:'10px',gap:'6px'}}>
                <span style={{fontSize:'28px'}}>📸</span>
                <span style={{fontSize:'12px',color:'#ADADB3'}}>Tap to pick a photo or video</span>
              </div>
            )}
            {preview && (
              <button onClick={() => fileInput.current?.click()} style={{width:'100%',backgroundColor:'#F7F5F1',color:'#ADADB3',border:'none',borderRadius:'10px',padding:'8px',fontSize:'11px',cursor:'pointer',marginBottom:'10px'}}>
                Change photo
              </button>
            )}
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..." style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',fontFamily:'system-ui',resize:'none',outline:'none',height:'64px',boxSizing:'border-box',marginBottom:'10px'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={cancelAdd} style={{flex:1,backgroundColor:'#F7F5F1',color:'#ADADB3',border:'none',borderRadius:'11px',padding:'11px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Cancel</button>
              <button onClick={upload} disabled={!file || uploading} style={{flex:2,backgroundColor:'#263322',color:'#F68233',border:'none',borderRadius:'11px',padding:'11px',fontSize:'13px',fontWeight:'600',cursor:'pointer',opacity:!file||uploading?0.5:1}}>{uploading ? 'Uploading...' : 'Save memory'}</button>
            </div>
          </div>
        )}

        {memories.length === 0 && !adding && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'60px',lineHeight:'1.8'}}>
            <div style={{fontSize:'40px',marginBottom:'10px'}}>🖼️</div>
            No memories yet<br />add your first one above!
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          {memories.map(m => (
            <div key={m.id} onClick={() => setLightbox(m)} style={{borderRadius:'12px',overflow:'hidden',cursor:'pointer',aspectRatio:'1',position:'relative',backgroundColor:'#E4E1DB'}}>
              <img src={m.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.5))',padding:'20px 8px 7px'}}>
                <div style={{fontSize:'10px',fontWeight:'600',color:'rgba(255,255,255,0.9)'}}>{m.fromName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </div>
  )
}
