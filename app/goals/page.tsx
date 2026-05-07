'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import {
  collection, addDoc, onSnapshot, orderBy, query,
  doc, setDoc, deleteDoc, serverTimestamp, getDoc
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

type Goal = { id: string; text: string }
type Completions = Record<string, { harry?: boolean; nicole?: boolean }>

export default function GoalsPage() {
  const { user } = useAuth()
  const isHarry = user?.email === HARRY_EMAIL
  const myKey = isHarry ? 'harry' : 'nicole'

  const [goals, setGoals] = useState<Goal[]>([])
  const [completions, setCompletions] = useState<Completions>({})
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const longPressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Load goals list
  useEffect(() => {
    const q = query(collection(db, 'goalItems'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, text: d.data().text as string })))
    })
  }, [])

  // Load today's completions
  useEffect(() => {
    const ref = doc(db, 'goalCompletions', TODAY)
    return onSnapshot(ref, snap => {
      setCompletions(snap.exists() ? (snap.data() as Completions) : {})
    })
  }, [])

  async function toggleGoal(goalId: string) {
    if (!user) return
    const ref = doc(db, 'goalCompletions', TODAY)
    const snap = await getDoc(ref)
    const existing: Completions = snap.exists() ? (snap.data() as Completions) : {}
    const current = existing[goalId]?.[myKey] ?? false
    await setDoc(ref, {
      ...existing,
      [goalId]: { ...existing[goalId], [myKey]: !current },
    })
  }

  async function addGoal() {
    if (!newText.trim()) return
    setSaving(true)
    await addDoc(collection(db, 'goalItems'), { text: newText.trim(), createdAt: serverTimestamp() })
    setNewText('')
    setAdding(false)
    setSaving(false)
  }

  async function deleteGoal(id: string) {
    await deleteDoc(doc(db, 'goalItems', id))
    setPendingDelete(null)
  }

  function handleTouchStart(id: string) {
    longPressTimers.current[id] = setTimeout(() => setPendingDelete(id), 600)
  }

  function handleTouchEnd(id: string) {
    if (longPressTimers.current[id]) {
      clearTimeout(longPressTimers.current[id])
      delete longPressTimers.current[id]
    }
  }

  const doneCount = goals.filter(g => completions[g.id]?.harry && completions[g.id]?.nicole).length
  const total = goals.length

  function TickCircle({ goalId, who }: { goalId: string; who: 'harry' | 'nicole' }) {
    const done = !!completions[goalId]?.[who]
    const canTap = myKey === who
    const initial = who === 'harry' ? 'H' : 'N'
    return (
      <div
        onClick={canTap ? () => toggleGoal(goalId) : undefined}
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: done ? 'none' : '1.5px solid #E4E1DB',
          backgroundColor: done ? '#263322' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canTap ? 'pointer' : 'default',
          flexShrink: 0,
          opacity: !canTap && !done ? 0.4 : 1,
        }}
      >
        {done && (
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#F68233' }}>{initial}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <PageHeader
        title="Daily goals"
        right={<button onClick={() => setAdding(a => !a)} style={{ fontSize: '12px', color: '#F68233', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>}
      />

      <div style={{ padding: '12px 16px 0' }}>
        {/* Progress summary */}
        {total > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#ADADB3', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today's progress</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#18181A' }}>{doneCount}/{total}</div>
            </div>
            <div style={{ height: '4px', backgroundColor: '#F0EDE6', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${total > 0 ? (doneCount / total) * 100 : 0}%`, backgroundColor: '#F68233', borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Add goal form */}
        {adding && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '12px' }}>
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="Add a goal for today..."
              autoFocus
              style={{ width: '100%', backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB', borderRadius: '11px', padding: '10px 12px', fontSize: '13px', color: '#18181A', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setAdding(false); setNewText('') }} style={{ flex: 1, padding: '11px', borderRadius: '12px', fontSize: '13px', border: '1.5px solid #E4E1DB', backgroundColor: 'transparent', color: '#6B6B6E', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addGoal} disabled={saving || !newText.trim()} style={{ flex: 2, padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none', backgroundColor: '#263322', color: '#F68233', cursor: 'pointer', opacity: saving || !newText.trim() ? 0.5 : 1 }}>
                {saving ? 'Saving...' : 'Add goal'}
              </button>
            </div>
          </div>
        )}

        {/* Column legend */}
        {goals.length > 0 && (
          <div style={{ display: 'flex', padding: '0 14px', marginBottom: '4px' }}>
            <div style={{ fontSize: '9px', color: '#ADADB3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', width: '28px', textAlign: 'center' }}>H</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: '9px', color: '#ADADB3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', width: '28px', textAlign: 'center' }}>N</div>
          </div>
        )}

        {/* Goals list */}
        {goals.length === 0 && !adding && (
          <div style={{ textAlign: 'center', color: '#ADADB3', fontSize: '14px', marginTop: '40px' }}>
            No goals yet — tap + Add to get started
          </div>
        )}

        {goals.map(goal => {
          const harryDone = !!completions[goal.id]?.harry
          const nicoleDone = !!completions[goal.id]?.nicole
          const bothComplete = harryDone && nicoleDone
          return (
            <div
              key={goal.id}
              onTouchStart={() => handleTouchStart(goal.id)}
              onTouchEnd={() => handleTouchEnd(goal.id)}
              onTouchMove={() => handleTouchEnd(goal.id)}
              onContextMenu={e => { e.preventDefault(); setPendingDelete(goal.id) }}
              style={{
                backgroundColor: bothComplete ? 'rgba(62,138,56,0.05)' : '#fff',
                borderRadius: '14px', padding: '12px 14px',
                border: bothComplete ? '1.5px solid rgba(62,138,56,0.3)' : '1px solid rgba(0,0,0,0.07)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px',
              } as React.CSSProperties}
            >
              <TickCircle goalId={goal.id} who="harry" />
              <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: bothComplete ? '#ADADB3' : '#18181A', textDecoration: bothComplete ? 'line-through' : 'none', textAlign: 'center' }}>
                {goal.text}
              </div>
              <TickCircle goalId={goal.id} who="nicole" />
            </div>
          )
        })}


      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '320px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#18181A', marginBottom: '8px' }}>Delete goal?</div>
            <div style={{ fontSize: '13px', color: '#6B6B6E', marginBottom: '20px' }}>
              "{goals.find(g => g.id === pendingDelete)?.text}"
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPendingDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1.5px solid #E4E1DB', backgroundColor: 'transparent', color: '#6B6B6E', cursor: 'pointer' }}>Keep</button>
              <button onClick={() => pendingDelete && deleteGoal(pendingDelete)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none', backgroundColor: '#263322', color: '#F68233', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Nav />
    </div>
  )
}
