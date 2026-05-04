'use client'
import { useAuth } from '../context'
import { db, storage } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const WAVE_HEIGHTS = [8, 14, 20, 12, 18, 10, 16, 8, 14, 18, 10, 12]

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function Waveform({ playing }: { playing: boolean; id: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '20px', overflow: 'hidden' }}>
      {WAVE_HEIGHTS.map((h, i) => (
        <div key={i} style={{ width: '2.5px', borderRadius: '2px', backgroundColor: '#F68233', height: `${Math.round(h * 0.75)}px`, opacity: playing ? 1 : 0.3, animation: playing ? `wavePulse 0.7s ease-in-out ${i * 0.06}s infinite` : 'none', transformOrigin: 'center' }} />
      ))}
    </div>
  )
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recAudioUrl, setRecAudioUrl] = useState<string | null>(null)
  const [recSeconds, setRecSeconds] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setRecAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecRef.current = mr
      setRecording(true)
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      alert('Microphone permission denied')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    setAudioDuration(recSeconds)
    mediaRecRef.current?.stop()
    setRecording(false)
  }

  function discardAudio() {
    setAudioBlob(null)
    setRecAudioUrl(null)
    setAudioDuration(0)
    setRecSeconds(0)
  }

  function togglePlay(id: string, url: string) {
    if (playingId === id) {
      audioElRef.current?.pause()
      setPlayingId(null)
    } else {
      audioElRef.current?.pause()
      const audio = new Audio(url)
      audio.onended = () => setPlayingId(null)
      audio.play()
      audioElRef.current = audio
      setPlayingId(id)
    }
  }

  async function sendNote() {
    if ((!text.trim() && !audioBlob) || !user) return
    setSending(true)
    try {
      let voiceUrl: string | null = null
      if (audioBlob) {
        const sRef = storageRef(storage, `notes-audio/${Date.now()}_${user.uid}.webm`)
        await uploadBytes(sRef, audioBlob)
        voiceUrl = await getDownloadURL(sRef)
      }
      await addDoc(collection(db, 'notes'), {
        text: text.trim() || null,
        voiceUrl,
        voiceDuration: audioBlob ? audioDuration : null,
        from: user.email,
        fromName: isHarry ? 'Harry' : 'Nicole',
        createdAt: serverTimestamp(),
      })
      setText('')
      discardAudio()
    } finally {
      setSending(false)
    }
  }

  const canSend = !sending && (!!text.trim() || !!audioBlob)

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <PageHeader title="Love notes" />

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#ADADB3', marginBottom: '8px' }}>Leave {isHarry ? 'Nicole' : 'Harry'} a note</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write something nice..."
            style={{ width: '100%', backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB', borderRadius: '11px', padding: '10px 12px', fontSize: '13px', color: '#18181A', fontFamily: 'system-ui', resize: 'none', outline: 'none', height: '76px', boxSizing: 'border-box' }}
          />

          {recAudioUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F7F5F1', borderRadius: '11px', padding: '10px 12px', marginTop: '8px' }}>
              <button onClick={() => togglePlay('preview', recAudioUrl)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F68233', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {playingId === 'preview'
                  ? <svg width="10" height="10" fill="#fff" viewBox="0 0 10 10"><rect x="1" y="1" width="3" height="8" rx="1" /><rect x="6" y="1" width="3" height="8" rx="1" /></svg>
                  : <svg width="10" height="10" fill="#fff" viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z" /></svg>}
              </button>
              <Waveform playing={playingId === 'preview'} id="preview" />
              <span style={{ fontSize: '11px', color: '#ADADB3', flexShrink: 0 }}>{fmt(audioDuration)}</span>
              <button onClick={discardAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ADADB3', fontSize: '18px', lineHeight: '1', padding: '0', flexShrink: 0 }}>×</button>
            </div>
          ) : recording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(232,69,69,0.06)', borderRadius: '11px', padding: '10px 12px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E84545', animation: 'wavePulse 0.8s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#E84545', flex: 1 }}>Recording {fmt(recSeconds)}</span>
              <button onClick={stopRecording} style={{ backgroundColor: '#E84545', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Stop</button>
            </div>
          ) : (
            <button onClick={startRecording} style={{ marginTop: '8px', width: '100%', backgroundColor: '#F7F5F1', color: '#ADADB3', border: '1.5px dashed #E4E1DB', borderRadius: '11px', padding: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              🎙 Record a voice note
            </button>
          )}

          <button onClick={sendNote} disabled={!canSend} style={{ marginTop: '8px', width: '100%', backgroundColor: '#263322', color: '#F68233', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: canSend ? 1 : 0.5 }}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ADADB3', padding: '4px 2px 10px' }}>Recent notes</div>

        {notes.map(note => (
          <div key={note.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={note.fromName === 'Harry' ? '/harry-icon.svg' : '/nicole-icon.svg'} alt={note.fromName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#F68233' }}>From {note.fromName}</div>
            </div>
            {note.text && <div style={{ fontSize: '13px', color: '#18181A', lineHeight: '1.58', fontStyle: 'italic', marginBottom: note.voiceUrl ? '8px' : '0' }}>"{note.text}"</div>}
            {note.voiceUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F7F5F1', borderRadius: '10px', padding: '8px 10px' }}>
                <button onClick={() => togglePlay(note.id, note.voiceUrl)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F68233', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {playingId === note.id
                    ? <svg width="8" height="8" fill="#fff" viewBox="0 0 10 10"><rect x="1" y="1" width="3" height="8" rx="1" /><rect x="6" y="1" width="3" height="8" rx="1" /></svg>
                    : <svg width="8" height="8" fill="#fff" viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z" /></svg>}
                </button>
                <Waveform playing={playingId === note.id} id={note.id} />
                {note.voiceDuration != null && <span style={{ fontSize: '10px', color: '#ADADB3', flexShrink: 0 }}>{fmt(note.voiceDuration)}</span>}
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#ADADB3', marginTop: '6px' }}>
              {note.createdAt?.toDate?.()?.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) ?? 'Just now'}
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
