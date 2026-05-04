'use client'
import { useAuth } from '../context'
import { db, storage } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

export default function MemoriesPage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState<any[]>([])
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [lightbox, setLightbox] = useState<any | null>(null)
  const [lightboxIsVideo, setLightboxIsVideo] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  function isVideo(m: any) {
    return m.mediaType?.startsWith('video/') || m.url?.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i)
  }

  function isVideoFile(f: File) {
    return f.type.startsWith('video/')
  }

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (!picked.length) return
    setFiles(prev => [...prev, ...picked])
    setPreviews(prev => [...prev, ...picked.map(f => URL.createObjectURL(f))])
    if (fileInput.current) fileInput.current.value = ''
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function upload() {
    if (!files.length || !user) return
    setUploading(true)
    setUploadProgress({ current: 0, total: files.length })
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        setUploadProgress({ current: i + 1, total: files.length })
        const sRef = storageRef(storage, `memories/${Date.now()}_${user.uid}_${i}`)
        await uploadBytes(sRef, f)
        const url = await getDownloadURL(sRef)
        await addDoc(collection(db, 'memories'), {
          url,
          caption: caption.trim(),
          from: user.email,
          fromName: isHarry ? 'Harry' : 'Nicole',
          mediaType: f.type,
          createdAt: serverTimestamp(),
        })
      }
      setCaption('')
      setFiles([])
      setPreviews([])
      setAdding(false)
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  function cancelAdd() {
    setAdding(false)
    setPreviews([])
    setFiles([])
    setCaption('')
    if (fileInput.current) fileInput.current.value = ''
  }

  async function deleteMemory(id: string) {
    await deleteDoc(doc(db, 'memories', id))
    setLightbox(null)
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          {lightboxIsVideo
            ? <video src={lightbox.url} controls playsInline onClick={(e) => e.stopPropagation()} style={{maxWidth:'100%',maxHeight:'60vh',borderRadius:'12px'}} />
            : <img src={lightbox.url} alt="" onError={() => setLightboxIsVideo(true)} style={{maxWidth:'100%',maxHeight:'60vh',borderRadius:'12px',objectFit:'contain'}} />}
          {lightbox.caption && (
            <div style={{color:'#F0EDE6',fontSize:'14px',marginTop:'14px',textAlign:'center',fontStyle:'italic'}}>"{lightbox.caption}"</div>
          )}
          <div style={{color:'#6A9B63',fontSize:'11px',marginTop:'8px'}}>
            {lightbox.fromName} · {lightbox.createdAt?.toDate?.()?.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); deleteMemory(lightbox.id) }}
            style={{marginTop:'20px',padding:'10px 28px',borderRadius:'100px',backgroundColor:'rgba(255,60,60,0.15)',border:'1px solid rgba(255,60,60,0.35)',color:'#ff6060',fontSize:'13px',cursor:'pointer',fontFamily:'system-ui'}}
          >
            Delete
          </button>
        </div>
      )}

      <PageHeader title="Memories" right={
        <button onClick={() => setAdding(true)} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#263322',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#F68233',fontSize:'22px',fontWeight:'300',lineHeight:'1'}}>+</button>
      } />

      <div style={{padding:'12px 16px 0'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#18181A',marginBottom:'12px'}}>New memories</div>
            <input ref={fileInput} type="file" accept="image/*,video/*" multiple onChange={pickFiles} style={{display:'none'}} />

            {/* Preview strip */}
            {previews.length > 0 && (
              <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'10px',paddingBottom:'4px'}}>
                {previews.map((src, i) => (
                  <div key={i} style={{position:'relative',flexShrink:0,width:'80px',height:'80px',borderRadius:'10px',overflow:'hidden',backgroundColor:'#E4E1DB'}}>
                    {isVideoFile(files[i])
                      ? <video src={src} muted style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
                    <button
                      onClick={() => removeFile(i)}
                      style={{position:'absolute',top:'3px',right:'3px',width:'18px',height:'18px',borderRadius:'50%',backgroundColor:'rgba(0,0,0,0.6)',border:'none',color:'#fff',fontSize:'12px',lineHeight:'1',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}
                    >×</button>
                  </div>
                ))}
                {/* Add more button */}
                <div onClick={() => fileInput.current?.click()} style={{flexShrink:0,width:'80px',height:'80px',borderRadius:'10px',border:'2px dashed #E4E1DB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#ADADB3',fontSize:'22px'}}>
                  +
                </div>
              </div>
            )}

            {/* Initial pick prompt */}
            {previews.length === 0 && (
              <div onClick={() => fileInput.current?.click()} style={{border:'2px dashed #E4E1DB',borderRadius:'12px',padding:'28px',textAlign:'center',cursor:'pointer',marginBottom:'10px',color:'#ADADB3',fontSize:'13px',lineHeight:'1.8'}}>
                Tap to add photos or videos<br />
                <span style={{fontSize:'11px'}}>You can select multiple at once</span>
              </div>
            )}

            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={files.length > 1 ? `Caption for all ${files.length} photos…` : 'Add a caption…'}
              style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'10px',boxSizing:'border-box',fontFamily:'system-ui'}}
            />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={cancelAdd} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={upload} disabled={uploading || !files.length} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:uploading||!files.length?0.5:1}}>
                {uploadProgress ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…` : files.length > 1 ? `Save ${files.length} photos` : 'Save'}
              </button>
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
            <div key={m.id} onClick={() => { setLightbox(m); setLightboxIsVideo(isVideo(m)) }} style={{borderRadius:'12px',overflow:'hidden',cursor:'pointer',aspectRatio:'1',position:'relative',backgroundColor:'#E4E1DB'}}>
              {isVideo(m)
                ? <video src={m.url} muted playsInline preload="metadata" onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.001 }} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : <img src={m.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
              {isVideo(m) && (
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'32px',height:'32px',borderRadius:'50%',backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="12" height="12" fill="#fff" viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z"/></svg>
                </div>
              )}
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
