'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

const WORDS = ['BRAVE','CRANE','FLAME','GRANT','PORCH','TWIST','PLACE','STONE','FLUTE','DRINK','SPORT','LIGHT','PLANT','BRUSH','CLOUD','CHESS','QUILT','RIVER','SWEEP','TORCH','ABOUT','ABOVE','ABUSE','ACTOR','ADMIT','ADOPT','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM','ALBUM','ALIKE','ALIVE','ALLOW','ALONE','ALONG','ALTER','ANGEL','ANGER','ANGLE','ANGRY','ANKLE','APART','APPLE','APPLY','ARGUE','ARISE','ARRAY','ARROW','ASIDE','AVOID','AWAKE','AWARD','AWARE','AWFUL','BEACH','BEARD','BEAST','BEGIN','BEING','BELOW','BENCH','BLACK','BLADE','BLAME','BLANK','BLAST','BLAZE','BLEED','BLEND','BLESS','BLIND','BLOCK','BLOOD','BLOOM','BLOWN','BOARD','BONUS','BOOST','BOUND','BRAIN','BRAND','BREAD','BREAK','BREED','BRICK','BRIDE','BRIEF','BRING','BROAD','BROKE','BROWN','BUILD','BUILT','BUNCH','BURST','CANDY','CARRY','CAUSE','CHAIR','CHAOS','CHARM','CHART','CHASE','CHEAP','CHECK','CHEER','CHEST','CHIEF','CHILD','CIVIC','CIVIL','CLAIM','CLASS','CLEAN','CLEAR','CLICK','CLIFF','CLIMB','CLOCK','COACH','COAST','CORAL','COULD','COUNT','COURT','COVER','CRACK','CRAFT','CRASH','CRAZY','CREAM','CREEK','CRIME','CRISP','CROSS','CROWD','CROWN','CRUEL','CRUSH','CURVE','CYCLE','DAILY','DAIRY','DANCE','DEATH','DEBUT','DECAY','DELAY','DENSE','DEPTH','DEVIL','DISCO','DIRTY','DODGE','DOUBT','DRAFT','DRAIN','DRAMA','DREAD','DREAM','DRESS','DRIFT','DRIVE','DRONE','DROWN','DWARF','EAGER','EARLY','EARTH','EIGHT','ELITE','EMPTY','ENEMY','ENJOY','ENTER','ENTRY','EQUAL','ERROR','ESSAY','EVERY','EXACT','EXIST','EXTRA','FAIRY','FAITH','FANCY','FAULT','FEAST','FENCE','FEVER','FIELD','FIFTH','FIFTY','FIGHT','FINAL','FIRST','FIXED','FLASH','FLESH','FLOAT','FLOOD','FLOOR','FLOUR','FOCUS','FORCE','FORGE','FRAME','FRANK','FRESH','FRONT','FROST','FRUIT','FUNNY','GHOST','GIANT','GIVEN','GLASS','GLOOM','GLOVE','GOING','GRACE','GRADE','GRAIN','GRAND','GRAPH','GRASS','GREAT','GREET','GRIEF','GRIME','GRIND','GROSS','GROUP','GROVE','GROWN','GUARD','GUEST','GUIDE','GUILT','HABIT','HAPPY','HARSH','HEART','HEAVY','HENCE','HONEY','HORSE','HOTEL','HOUSE','HUMAN','HUMOR','IDEAL','IMAGE','INDEX','INNER','INPUT','ISSUE','IVORY','JEWEL','JUICE','KNIFE','KNOCK','LARGE','LASER','LATER','LAUGH','LAYER','LEARN','LEGAL','LEVEL','LIMIT','LINEN','LIVER','LOCAL','LODGE','LOGIC','LOOSE','LOVER','LOWER','LUCKY','LUNAR','MAGIC','MAJOR','MAKER','MANOR','MARCH','MARSH','MATCH','MAYOR','MEDIA','MERCY','MERIT','METAL','MIGHT','MONEY','MONTH','MORAL','MOTOR','MOUNT','MOUSE','MOUTH','MOVIE','MUSIC','NAIVE','NERVE','NEVER','NIGHT','NOBLE','NOISE','NORTH','NOTED','NOVEL','NURSE','OCEAN','OFFER','OFTEN','OLIVE','OPERA','ORBIT','ORDER','OTHER','OUTER','OWNER','OXIDE','OZONE','PAINT','PANIC','PAPER','PARTY','PASTA','PATCH','PAUSE','PEACE','PEARL','PENNY','PHONE','PHOTO','PIANO','PILOT','PITCH','PIXEL','PLACE','PLAIN','PLANE','PLATE','PLAZA','PLUCK','POINT','POLAR','POWER','PRESS','PRICE','PRIDE','PRIME','PRINT','PRIOR','PRIZE','PROBE','PROOF','PROSE','PROUD','PULSE','PUNCH','PUPIL','QUEEN','QUERY','QUEST','QUICK','QUIET','QUOTA','QUOTE','RADAR','RAISE','RALLY','RANGE','RAPID','RATIO','REACH','REACT','READY','REALM','REBEL','REFER','REIGN','RELAX','RENEW','REPAY','REPLY','RIDER','RIDGE','RIGHT','RISEN','RISKY','RIVAL','ROCKY','ROUGH','ROUND','ROUTE','ROYAL','RULER','RURAL','SADLY','SAINT','SALAD','SAUCE','SCALE','SCENE','SCOPE','SCORE','SCOUT','SEIZE','SENSE','SEVEN','SHADE','SHAFT','SHAKE','SHALL','SHAME','SHAPE','SHARE','SHARP','SHELF','SHELL','SHIFT','SHINY','SHOCK','SHOOT','SHORE','SHORT','SHOUT','SIGHT','SILLY','SINCE','SIXTH','SIXTY','SKILL','SLICE','SLIDE','SLOPE','SMALL','SMART','SMELL','SMILE','SMOKE','SOLID','SOLVE','SORRY','SOUTH','SPACE','SPARE','SPARK','SPEAK','SPEED','SPEND','SPINE','SPITE','SPLIT','SPRAY','SQUAD','STACK','STAGE','STAIN','STAIR','STAKE','STALE','STAND','STARE','START','STATE','STEAK','STEAM','STEEP','STEER','STERN','STICK','STILL','STOCK','STOOD','STORM','STORY','STOVE','STRAW','STUCK','STYLE','SUGAR','SUITE','SUNNY','SUPER','SURGE','SWEAR','SWEAT','SWEEP','SWEET','SWIFT','SWING','TABLE','TAKEN','TASTE','TEACH','TEETH','TEMPO','TENSE','TENTH','TERMS','THEFT','THEIR','THEME','THERE','THESE','THICK','THINK','THORN','THREE','THREW','THROW','THUMB','TIGER','TIGHT','TIRED','TITLE','TODAY','TOKEN','TOOTH','TOPIC','TOTAL','TOUCH','TOUGH','TOWER','TOXIC','TRACK','TRADE','TRAIL','TRAIN','TRAIT','TRASH','TREAT','TREND','TRIAL','TRIBE','TRICK','TRIED','TROOP','TRUCK','TRULY','TRUNK','TRUST','TRUTH','TUTOR','TWICE','ULTRA','UNDER','UNION','UNITE','UNTIL','UPPER','URBAN','USAGE','USUAL','UTTER','VALID','VALUE','VALVE','VAULT','VIDEO','VIRAL','VISIT','VISTA','VITAL','VIVID','VOCAL','VOICE','VOTER','WASTE','WATCH','WATER','WEARY','WEAVE','WEIGH','WEIRD','WHALE','WHEEL','WHERE','WHICH','WHILE','WHITE','WHOLE','WHOSE','WITCH','WOMAN','WOMEN','WORLD','WORRY','WORSE','WORST','WORTH','WOULD','WOUND','WRATH','WRITE','WRONG','YACHT','YIELD','YOUNG','YOURS','YOUTH','ZEBRA']

const VALID = new Set(WORDS)

function getTodayWord() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate()
  return WORDS[seed % WORDS.length]
}

const TODAY = new Date().toISOString().split('T')[0]

export default function WordGamePage() {
  const router = useRouter()
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

  useEffect(() => {
    const ref = doc(db, 'wordgame', TODAY)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        if (data[myKey]) { setGuesses(data[myKey].guesses || []); setDone(data[myKey].done || false) }
        if (data[otherKey]) { setOtherGuesses(data[otherKey].guesses || []); setOtherDone(data[otherKey].done || false) }
        if (data.scores) setScores(data.scores)
      }
    })
    return unsub
  }, [user])

  async function saveState(newGuesses: string[], isDone: boolean) {
    const ref = doc(db, 'wordgame', TODAY)
    const snap = await getDoc(ref)
    const existing = snap.exists() ? snap.data() : {}
    await setDoc(ref, { ...existing, [myKey]: { guesses: newGuesses, done: isDone } })
  }

  function getColor(guess: string, pos: number) {
    const ch = guess[pos]
    if (ch === WORD[pos]) return '#3E8A38'
    if (WORD.includes(ch)) return '#F68233'
    return '#888'
  }

  function handleKey(k: string) {
    if (done) return
    if (k === 'DEL') { setCurrent(c => c.slice(0,-1)); return }
    if (k === 'ENTER') {
      if (current.length !== 5) { setStatus('Need 5 letters'); return }
      if (!VALID.has(current)) { setStatus('Not a valid word — try again'); return }
      const newGuesses = [...guesses, current]
      const won = current === WORD
      const isDone = won || newGuesses.length === 6
      setGuesses(newGuesses)
      setCurrent('')
      if (won) setStatus('🎉 Got it!')
      else if (isDone) setStatus('The word was ' + WORD)
      else setStatus('Guess ' + (newGuesses.length+1) + ' of 6')
      setDone(isDone)
      saveState(newGuesses, isDone)
      return
    }
    if (current.length < 5 && /^[A-Z]$/.test(k)) setCurrent(c => c+k)
  }

  const keyRows = [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','DEL']]
  const usedKeys: Record<string,string> = {}
  guesses.forEach(g => [...g].forEach((ch,i) => {
    if (ch===WORD[i]) usedKeys[ch]='correct'
    else if (WORD.includes(ch) && usedKeys[ch]!=='correct') usedKeys[ch]='present'
    else if (!usedKeys[ch]) usedKeys[ch]='absent'
  }))

  const keyColor = (k: string) => {
    if (usedKeys[k]==='correct') return {bg:'#3E8A38',fg:'#fff'}
    if (usedKeys[k]==='present') return {bg:'#F68233',fg:'#263322'}
    if (usedKeys[k]==='absent') return {bg:'#888',fg:'#fff'}
    return {bg:'#E4E1DB',fg:'#18181A'}
  }

  const renderBoard = (gs: string[], cur: string, isMe: boolean) => (
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'4px',marginBottom:'8px'}}>
      {Array.from({length:6}).map((_,r) => (
        Array.from({length:5}).map((_,c) => {
          const g = gs[r]
          const ch = g ? g[c] : (isMe && r===gs.length ? cur[c]||'' : '')
          const bg = g ? getColor(g,c) : (isMe && r===gs.length && ch ? '#263322' : '#fff')
          const fg = g ? '#fff' : (isMe && r===gs.length && ch ? '#F68233' : '#18181A')
          return (
            <div key={c} style={{aspectRatio:'1',borderRadius:'8px',border:'1.5px solid '+(g?'transparent':'#E4E1DB'),backgroundColor:bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',fontSize:'18px',color:fg,textTransform:'uppercase'}}>
              {ch}
            </div>
          )
        })
      ))}
    </div>
  )

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Word game</h1>
      </div>

      <div style={{padding:'0 16px'}}>
        <div style={{backgroundColor:'#fff',borderRadius:'16px',padding:'14px 20px',border:'1px solid rgba(0,0,0,0.07)',display:'flex',justifyContent:'center',gap:'28px',marginBottom:'12px'}}>
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

        <div style={{textAlign:'center',fontSize:'12px',fontWeight:'500',color:'#6B6B6E',marginBottom:'10px',minHeight:'22px'}}>{status}</div>

        <div style={{marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>Your board</div>
          {renderBoard(guesses, current, true)}
        </div>

        {done && (
          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:'600',color:'#ADADB3',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>{otherName}'s board {!otherDone && '(in progress)'}</div>
            {renderBoard(otherGuesses,'',false)}
          </div>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {keyRows.map((row,ri) => (
            <div key={ri} style={{display:'flex',justifyContent:'center',gap:'4px'}}>
              {row.map(k => {
                const {bg,fg} = keyColor(k)
                return (
                  <button key={k} onClick={()=>handleKey(k)} style={{height:'42px',minWidth:k.length>1?'52px':'32px',padding:'0 4px',borderRadius:'8px',border:'none',backgroundColor:bg,color:fg,fontSize:k.length>1?'10px':'13px',fontWeight:'600',cursor:'pointer',fontFamily:'system-ui'}}>
                    {k==='DEL'?'⌫':k}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <Nav />
    </div>
  )
}
