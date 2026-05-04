'use client'
import { useAuth } from '../context'
import { db, storage } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef, useMemo } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

type Memory = {
  id: string
  url: string
  mediaType?: string
  albumId?: string
  albumName?: string
  albumOrder?: number
  fromName?: string
  from?: string
  caption?: string
  createdAt?: any
}

type Album = {
  id: string
  name: string
  items: Memory[]
  fromName: string
  latestCreatedAt: any
}

function isVideoMedia(m: Memory) {
  return m.mediaType?.startsWith('video/') || !!m.url?.match(/\.(mp4|mov|webm|avi|m4v)(\?|$)/i)
}

export default function MemoriesPage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [albumName, setAlbumName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null)
  const [albumIndex, setAlbumIndex] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Memory)))
    })
  }, [])

  // Group flat memories into albums, preserving album order
  const albums = useMemo<Album[]>(() => {
    const map = new Map<string, Album>()
    for (const m of memories) {
      // Legacy memories (no albumId) each become their own album
      const aid = m.albumId ?? m.id
      const name = m.albumName ?? m.caption ?? ''
      if (!map.has(aid)) {
        map.set(aid, { id: aid, name, items: [], fromName: m.fromName ?? '', latestCreatedAt: m.createdAt })
      }
      map.get(aid)!.items.push(m)
    }
    for (const album of map.values()) {
      album.items.sort((a, b) => (a.albumOrder ?? 0) - (b.albumOrder ?? 0))
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.latestCreatedAt?.seconds ?? 0) - (a.latestCreatedAt?.seconds ?? 0)
    )
  }, [memories])

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
    const albumId = Date.now().toString(36) + '_' + user.uid.slice(0, 6)
    const name = albumName.trim() || 'Untitled'
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
          albumId,
          albumName: name,
          albumOrder: i,
          from: user.email,
          fromName: isHarry ? 'Harry' : 'Nicole',
          mediaType: f.type,
          createdAt: serverTimestamp(),
        })
      }
      setAlbumName('')
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
    setAlbumName('')
    if (fileInput.current) fileInput.current.value = ''
  }

  async function deleteItem(id: string) {
    await deleteDoc(doc(db, 'memories', id))
    if (!openAlbum) return
    const remaining = openAlbum.items.filter(item => item.id !== id)
    if (remaining.length === 0) {
      setOpenAlbum(null)
      setAlbumIndex(0)
    } else {
      setOpenAlbum({ ...openAlbum, items: remaining })
      setAlbumIndex(prev => Math.min(prev, remaining.length - 1))
    }
  }

  function closeAlbum() {
    setOpenAlbum(null)
    setAlbumIndex(0)
  }

  const currentItem = openAlbum?.items[albumIndex]
  const currentIsVideo = currentItem ? isVideoMedia(currentItem) : false

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>

      {/* Album viewer */}
      {openAlbum && currentItem && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.96)',zIndex:200,display:'flex',flexDirection:'column'}}>
          {/* Header bar */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'calc(env(safe-area-inset-top,0px) + 14px) 20px 14px',flexShrink:0}}>
            <button onClick={closeAlbum} style={{background:'none',border:'none',color:'rgba(255,255,255,0.7)',fontSize:'24px',cursor:'pointer',padding:'4px',lineHeight:1,width:'32px',textAlign:'center'}}>×</button>
            <div style={{textAlign:'center',flex:1,padding:'0 8px'}}>
              {openAlbum.name && (
                <div style={{color:'#F0EDE6',fontSize:'14px',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{openAlbum.name}</div>
              )}
              {openAlbum.items.length > 1 && (
                <div style={{color:'#6A9B63',fontSize:'11px',marginTop:'2px'}}>{albumIndex + 1} / {openAlbum.items.length}</div>
              )}
            </div>
            <button
              onClick={() => deleteItem(currentItem.id)}
              style={{background:'none',border:'none',color:'rgba(255,90,90,0.8)',fontSize:'12px',cursor:'pointer',padding:'4px',whiteSpace:'nowrap'}}
            >Delete</button>
          </div>

          {/* Media area with prev/next */}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',padding:'0 52px'}}>
            {currentIsVideo
              ? <video key={currentItem.id} src={currentItem.url} controls playsInline style={{maxWidth:'100%',maxHeight:'100%',borderRadius:'10px'}} />
              : <img key={currentItem.id} src={currentItem.url} alt="" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:'6px'}} />}

            {albumIndex > 0 && (
              <button onClick={() => setAlbumIndex(i => i - 1)} style={{position:'absolute',left:'8px',width:'36px',height:'36px',borderRadius:'50%',backgroundColor:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',color:'#fff',fontSize:'20px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
            )}
            {albumIndex < openAlbum.items.length - 1 && (
              <button onClick={() => setAlbumIndex(i => i + 1)} style={{position:'absolute',right:'8px',width:'36px',height:'36px',borderRadius:'50%',backgroundColor:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',color:'#fff',fontSize:'20px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>›</button>
            )}
          </div>

          {/* Dot indicators + bottom padding */}
          <div style={{padding:'14px 20px',paddingBottom:'calc(20px + env(safe-area-inset-bottom,0px))',flexShrink:0,display:'flex',justifyContent:'center',gap:'6px',flexWrap:'wrap'}}>
            {openAlbum.items.length > 1 && openAlbum.items.map((_, i) => (
              <div
                key={i}
                onClick={() => setAlbumIndex(i)}
                style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:i===albumIndex?'#F68233':'rgba(255,255,255,0.25)',cursor:'pointer',flexShrink:0}}
              />
            ))}
          </div>
        </div>
      )}

      <PageHeader title="Memories" right={
        <button onClick={() => setAdding(true)} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#263322',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#F68233',fontSize:'22px',fontWeight:'300',lineHeight:'1'}}>+</button>
      } />

      <div style={{padding:'12px 16px 0'}}>
        {adding && (
          <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'16px',border:'1px solid rgba(0,0,0,0.07)',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#18181A',marginBottom:'12px'}}>New album</div>
            <input ref={fileInput} type="file" accept="image/*,video/*" multiple onChange={pickFiles} style={{display:'none'}} />

            {previews.length > 0 && (
              <div style={{display:'flex',gap:'8px',overflowX:'auto',marginBottom:'10px',paddingBottom:'4px'}}>
                {previews.map((src, i) => (
                  <div key={i} style={{position:'relative',flexShrink:0,width:'80px',height:'80px',borderRadius:'10px',overflow:'hidden',backgroundColor:'#E4E1DB'}}>
                    {files[i]?.type.startsWith('video/')
                      ? <video src={src} muted style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
                    <button onClick={() => removeFile(i)} style={{position:'absolute',top:'3px',right:'3px',width:'18px',height:'18px',borderRadius:'50%',backgroundColor:'rgba(0,0,0,0.6)',border:'none',color:'#fff',fontSize:'12px',lineHeight:'1',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>×</button>
                  </div>
                ))}
                <div onClick={() => fileInput.current?.click()} style={{flexShrink:0,width:'80px',height:'80px',borderRadius:'10px',border:'2px dashed #E4E1DB',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#ADADB3',fontSize:'22px'}}>+</div>
              </div>
            )}

            {previews.length === 0 && (
              <div onClick={() => fileInput.current?.click()} style={{border:'2px dashed #E4E1DB',borderRadius:'12px',padding:'28px',textAlign:'center',cursor:'pointer',marginBottom:'10px',color:'#ADADB3',fontSize:'13px',lineHeight:'1.8'}}>
                Tap to add photos or videos<br />
                <span style={{fontSize:'11px'}}>You can select multiple at once</span>
              </div>
            )}

            <input
              value={albumName}
              onChange={e => setAlbumName(e.target.value)}
              placeholder="Album name (e.g. Paris trip, Christmas…)"
              style={{width:'100%',backgroundColor:'#F7F5F1',border:'1.5px solid #E4E1DB',borderRadius:'11px',padding:'10px 12px',fontSize:'13px',color:'#18181A',outline:'none',marginBottom:'10px',boxSizing:'border-box',fontFamily:'system-ui'}}
            />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={cancelAdd} style={{flex:1,padding:'12px',borderRadius:'12px',fontSize:'13px',border:'1.5px solid #E4E1DB',backgroundColor:'transparent',color:'#6B6B6E',cursor:'pointer'}}>Cancel</button>
              <button onClick={upload} disabled={uploading || !files.length} style={{flex:2,padding:'12px',borderRadius:'12px',fontSize:'13px',fontWeight:'600',border:'none',backgroundColor:'#263322',color:'#F68233',cursor:'pointer',opacity:uploading||!files.length?0.5:1}}>
                {uploadProgress
                  ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
                  : files.length > 1 ? `Save ${files.length} photos` : 'Save'}
              </button>
            </div>
          </div>
        )}

        {albums.length === 0 && !adding && (
          <div style={{textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'60px',lineHeight:'1.8'}}>
            <div style={{fontSize:'40px',marginBottom:'10px'}}>🖼️</div>
            No memories yet<br />add your first one above!
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          {albums.map(album => {
            const cover = album.items[0]
            const coverIsVideo = isVideoMedia(cover)
            const label = album.name || album.fromName
            return (
              <div key={album.id} onClick={() => { setOpenAlbum(album); setAlbumIndex(0) }} style={{borderRadius:'12px',overflow:'hidden',cursor:'pointer',aspectRatio:'1',position:'relative',backgroundColor:'#E4E1DB'}}>
                {coverIsVideo
                  ? <video src={cover.url} muted playsInline preload="metadata" onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.001 }} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  : <img src={cover.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
                {coverIsVideo && (
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'32px',height:'32px',borderRadius:'50%',backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="12" height="12" fill="#fff" viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z"/></svg>
                  </div>
                )}
                {album.items.length > 1 && (
                  <div style={{position:'absolute',top:'7px',right:'7px',backgroundColor:'rgba(0,0,0,0.5)',borderRadius:'100px',padding:'2px 7px',fontSize:'10px',fontWeight:'600',color:'#fff'}}>
                    {album.items.length}
                  </div>
                )}
                {label && (
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.58))',padding:'20px 8px 7px'}}>
                    <div style={{fontSize:'10px',fontWeight:'600',color:'rgba(255,255,255,0.92)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <Nav />
    </div>
  )
}
