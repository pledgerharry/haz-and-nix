'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'
import { ANSWERS, VALID_GUESSES } from './wordlist'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const VALID = new Set([...ANSWERS, ...VALID_GUESSES])

function getTodayWord(): string {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return ANSWERS[seed % ANSWERS.length]
}

const TODAY = new Date().toISOString().split('T')[0]

export default function WordGamePage() {
  const { user } = useAuth()
  const isHarry = user?.email === HARRY_EMAIL
  const myKey = isHarry ? 'harry' : 'nicole'
  const otherKey = isHarry ? 'nicole' : 'harry'
  const otherName = isHarry ? 'Nicole' : 'Harry'

  const WORD = getTodayWord()
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [done, setDone] = useState(false)
  const [status, setStatus] = useState('Guess the 5-letter word · 6 tries')
  const [otherGuesses, setOtherGuesses] = useState<string[]>([])
  const [otherDone, setOtherDone] = useState(false)
  const [scores, setScores] = useState({ harry: 0, nicole: 0 })
  const [shakeRow, setShakeRow] = useState(false)
  const [bothDone, setBothDone] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'wordgame', TODAY)
    return onSnapshot(ref, snap => {
      if (!snap.exists()) return
      const data = snap.data()
      if (data[myKey]) {
        setGuesses(data[myKey].guesses || [])
        setDone(data[myKey].done || false)
        if (data[myKey].done) {
          const gs: string[] = data[myKey].guesses || []
          const won = data[myKey].won === true
          if (won) setStatus('🎉 Got it!')
          else setStatus('The word was ' + WORD)
        }
      }
      if (data[otherKey]) {
        setOtherGuesses(data[otherKey].guesses || [])
        setOtherDone(data[otherKey].done || false)
      }
      if (data[myKey]?.done && data[otherKey]?.done) setBothDone(true)
    })
  }, [user])

  useEffect(() => {
    const ref = doc(db, 'wordgame', 'scores')
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        setScores({ harry: data.harry || 0, nicole: data.nicole || 0 })
      }
    })
  }, [])

  async function saveState(newGuesses: string[], isDone: boolean, won: boolean) {
    const ref = doc(db, 'wordgame', TODAY)
    const snap = await getDoc(ref)
    const existing = snap.exists() ? snap.data() : {}

    await setDoc(ref, {
      ...existing,
      [myKey]: { guesses: newGuesses, done: isDone, won },
    })

    // Only score when both players are done and the day hasn't been scored yet
    if (isDone && !existing.scored) {
      const other = existing[otherKey]
      if (other?.done === true) {
        const myCount = won ? newGuesses.length : 7
        const otherWon = other.won === true
        const otherCount = otherWon ? (other.guesses?.length ?? 7) : 7

        let winner: string | null = null
        if (myCount < otherCount) winner = myKey
        else if (otherCount < myCount) winner = otherKey

        await updateDoc(ref, { scored: true })

        if (winner) {
          const scoresRef = doc(db, 'wordgame', 'scores')
          const scoresSnap = await getDoc(scoresRef)
          if (scoresSnap.exists()) {
            await updateDoc(scoresRef, { [winner]: increment(1) })
          } else {
            await setDoc(scoresRef, { harry: winner === 'harry' ? 1 : 0, nicole: winner === 'nicole' ? 1 : 0 })
          }
        }
      }
    }
  }

  function getColors(guess: string): string[] {
    const colors = Array(5).fill('#888')
    const remaining: Record<string, number> = {}
    for (const ch of WORD) remaining[ch] = (remaining[ch] ?? 0) + 1
    for (let i = 0; i < 5; i++) {
      if (guess[i] === WORD[i]) { colors[i] = '#3E8A38'; remaining[guess[i]]-- }
    }
    for (let i = 0; i < 5; i++) {
      if (colors[i] !== '#3E8A38' && remaining[guess[i]] > 0) {
        colors[i] = '#F68233'
        remaining[guess[i]]--
      }
    }
    return colors
  }

  function triggerShake() {
    setShakeRow(true)
    setTimeout(() => setShakeRow(false), 600)
  }

  function handleKey(k: string) {
    if (done) return
    if (k === 'DEL') { setCurrent(c => c.slice(0, -1)); return }
    if (k === 'ENTER') {
      if (current.length !== 5) { setStatus('Need 5 letters'); triggerShake(); return }
      if (!VALID.has(current)) { setStatus('Not a valid word'); triggerShake(); return }
      const newGuesses = [...guesses, current]
      const won = current === WORD
      const isDone = won || newGuesses.length === 6
      setGuesses(newGuesses)
      setCurrent('')
      if (won) setStatus('🎉 Got it!')
      else if (isDone) setStatus('The word was ' + WORD)
      else setStatus('Guess ' + (newGuesses.length + 1) + ' of 6')
      setDone(isDone)
      saveState(newGuesses, isDone, won)
      return
    }
    if (current.length < 5 && /^[A-Z]$/.test(k)) setCurrent(c => c + k)
  }

  const keyRows = [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']]

  const usedKeys: Record<string, string> = {}
  guesses.forEach(g => {
    const colors = getColors(g)
    ;[...g].forEach((ch, i) => {
      const state = colors[i] === '#3E8A38' ? 'correct' : colors[i] === '#F68233' ? 'present' : 'absent'
      if (state === 'correct') usedKeys[ch] = 'correct'
      else if (state === 'present' && usedKeys[ch] !== 'correct') usedKeys[ch] = 'present'
      else if (state === 'absent' && !usedKeys[ch]) usedKeys[ch] = 'absent'
    })
  })

  const keyColor = (k: string) => {
    if (usedKeys[k] === 'correct') return { bg: '#3E8A38', fg: '#fff' }
    if (usedKeys[k] === 'present') return { bg: '#F68233', fg: '#263322' }
    if (usedKeys[k] === 'absent') return { bg: '#888', fg: '#fff' }
    return { bg: '#E4E1DB', fg: '#18181A' }
  }

  function renderBoard(gs: string[], cur: string, isMe: boolean, compact = false) {
    const cellSize = compact ? '32px' : '38px'
    const gap = compact ? '2px' : '3px'
    const fontSize = compact ? '14px' : '16px'
    return (
      <div style={{display:'flex',flexDirection:'column',gap}}>
        {Array.from({ length: 6 }).map((_, ri) => {
          const guess = gs[ri]
          const isActive = isMe && ri === gs.length && !done
          const isShaking = isMe && isActive && shakeRow
          const colors = guess ? getColors(guess) : []
          return (
            <div
              key={ri}
              className={isShaking ? 'shake-row' : ''}
              style={{display:'flex',gap,justifyContent:'center'}}
            >
              {Array.from({ length: 5 }).map((__, ci) => {
                const ch = isActive ? (cur[ci] || '') : (guess?.[ci] || '')
                const revealed = !!guess
                const bg = revealed ? colors[ci] : (isActive && ch ? '#D0CCC4' : 'transparent')
                const border = revealed ? 'transparent' : '#D0CCC4'
                return (
                  <div key={ci} style={{width:cellSize,height:cellSize,borderRadius:'6px',border:`2px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize,fontWeight:'700',color:revealed?'#fff':'#18181A',backgroundColor:bg,flexShrink:0}}>
                    {ch}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const myName = isHarry ? 'Harry' : 'Nicole'

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))',paddingTop:'calc(env(safe-area-inset-top, 0px) + 56px)'}}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          35% { transform: translateX(5px); }
          55% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake-row { animation: shake 0.5s ease-in-out; }
      `}</style>
      <PageHeader title="Word game" />

      <div style={{padding:'12px 12px 0'}}>
        {/* All-time scores */}
        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'12px 20px',border:'1px solid rgba(0,0,0,0.07)',display:'flex',justifyContent:'center',gap:'28px',marginBottom:'10px'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'10px',color:'#ADADB3',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>Harry</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'22px',color:'#18181A'}}>{scores.harry}</div>
          </div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'18px',color:'#ADADB3',alignSelf:'center'}}>vs</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'10px',color:'#ADADB3',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>Nicole</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'22px',color:'#18181A'}}>{scores.nicole}</div>
          </div>
        </div>

        <div style={{textAlign:'center',fontSize:'12px',fontWeight:'500',color:'#6B6B6E',marginBottom:'8px',minHeight:'20px'}}>{status}</div>

        {/* Side-by-side boards when both done, otherwise just mine */}
        {bothDone ? (
          <div style={{marginBottom:'10px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div>
                <div style={{fontSize:'10px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'5px',textAlign:'center'}}>{myName}</div>
                {renderBoard(guesses, '', false, true)}
              </div>
              <div>
                <div style={{fontSize:'10px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'5px',textAlign:'center'}}>{otherName}</div>
                {renderBoard(otherGuesses, '', false, true)}
              </div>
            </div>
            <div style={{textAlign:'center',fontSize:'11px',color:'#ADADB3',marginTop:'8px'}}>
              {(() => {
                const myWon = guesses.length > 0 && guesses[guesses.length - 1] === WORD
                const otherWon = otherGuesses.length > 0 && otherGuesses[otherGuesses.length - 1] === WORD
                const myCount = myWon ? guesses.length : 7
                const otherCount = otherWon ? otherGuesses.length : 7
                if (myCount < otherCount) return `${myName} wins this round 🏆`
                if (otherCount < myCount) return `${otherName} wins this round 🏆`
                if (!myWon && !otherWon) return 'Neither got it today 😬'
                return 'A draw! 🤝'
              })()}
            </div>
          </div>
        ) : (
          <div style={{marginBottom:'10px'}}>
            <div style={{fontSize:'10px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'5px',textAlign:'center'}}>Your board</div>
            {renderBoard(guesses, current, true)}
            {done && !bothDone && (
              <div style={{textAlign:'center',fontSize:'11px',color:'#ADADB3',marginTop:'8px'}}>Waiting for {otherName} to finish...</div>
            )}
          </div>
        )}

        {!done && (
          <div style={{display:'flex',flexDirection:'column',gap:'5px',marginTop:'10px'}}>
            {keyRows.map((row, ri) => (
              <div key={ri} style={{display:'flex',justifyContent:'center',gap:'4px'}}>
                {row.map(k => {
                  const { bg, fg } = keyColor(k)
                  return (
                    <button key={k} onClick={() => handleKey(k)} style={{height:'40px',minWidth:k.length>1?'46px':'30px',flex:k.length>1?'0 0 auto':'1',maxWidth:k.length>1?'46px':'36px',padding:'0 2px',borderRadius:'7px',border:'none',backgroundColor:bg,color:fg,fontSize:k.length>1?'9px':'13px',fontWeight:'700',cursor:'pointer',fontFamily:'system-ui'}}>
                      {k === 'DEL' ? '⌫' : k}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <Nav />
    </div>
  )
}
