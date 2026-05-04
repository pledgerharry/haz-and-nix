'use client'
import { useRouter } from 'next/navigation'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Nav from '../components/Nav'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const REPEAT_OPTIONS = [
  { key: 'none', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom days' },
]

const inp: React.CSSProperties = {
  width: '100%', backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB',
  borderRadius: '11px', padding: '10px 12px', fontSize: '13px', color: '#18181A',
  outline: 'none', marginBottom: '10px', boxSizing: 'border-box', fontFamily: 'system-ui',
}

export function formatReminderDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function repeatLabel(rem: any) {
  if (!rem.repeatType || rem.repeatType === 'none') return rem.date ? formatReminderDate(rem.date) : ''
  if (rem.repeatType === 'daily') return 'Every day'
  if (rem.repeatType === 'weekly') return 'Every week'
  if (rem.repeatType === 'monthly') return 'Every month'
  if (rem.repeatType === 'custom' && rem.repeatDays?.length) return rem.repeatDays.join(' · ')
  return ''
}

export default function RemindersPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [repeatType, setRepeatType] = useState('none')
  const [repeatDays, setRepeatDays] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  function resetForm() {
    setTitle(''); setDate(''); setRepeatType('none'); setRepeatDays([])
  }

  function startAdd() {
    resetForm(); setEditingId(null); setAdding(true)
  }

  function startEdit(rem: any) {
    setTitle(rem.title || '')
    setDate(rem.date || '')
    setRepeatType(rem.repeatType || 'none')
    setRepeatDays(rem.repeatDays || [])
    setEditingId(rem.id)
    setAdding(true)
  }

  function cancelForm() {
    setAdding(false); setEditingId(null); resetForm()
  }

  async function saveReminder() {
    if (!title.trim()) return
    setSaving(true)
    const data = {
      title: title.trim(),
      date,
      repeatType,
      repeatDays: repeatType === 'custom' ? repeatDays : [],
    }
    if (editingId) {
      await updateDoc(doc(db, 'reminders', editingId), data)
    } else {
      await addDoc(collection(db, 'reminders'), { ...data, done: false, createdAt: serverTimestamp() })
    }
    cancelForm(); setSaving(false)
  }

  async function toggleDone(id: string, current: boolean) {
    await updateDoc(doc(db, 'reminders', id), { done: !current })
  }

  async function deleteReminder(id: string) {
    await deleteDoc(doc(db, 'reminders', id))
  }

  function toggleDay(day: string) {
    setRepeatDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day])
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: '80px' }}>
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => router.back()} style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#E4E1DB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '21px', color: '#18181A' }}>Reminders</h1>
        <button onClick={startAdd} style={{ marginLeft: 'auto', fontSize: '12px', color: '#F68233', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {adding && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#18181A', marginBottom: '14px' }}>{editingId ? 'Edit reminder' : 'New reminder'}</div>

            <div style={{ fontSize: '11px', color: '#ADADB3', marginBottom: '5px' }}>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you want to remember?" style={inp} />

            <div style={{ fontSize: '11px', color: '#ADADB3', marginBottom: '5px' }}>Date</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />

            <div style={{ fontSize: '11px', color: '#ADADB3', marginBottom: '7px' }}>Repeat</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {REPEAT_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setRepeatType(opt.key)} style={{ padding: '6px 11px', borderRadius: '100px', fontSize: '11px', fontWeight: '500', border: 'none', cursor: 'pointer', backgroundColor: repeatType === opt.key ? '#263322' : '#F7F5F1', color: repeatType === opt.key ? '#F68233' : '#6B6B6E' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {repeatType === 'custom' && (
              <>
                <div style={{ fontSize: '11px', color: '#ADADB3', marginBottom: '7px' }}>Days</div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)} style={{ flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '10px', fontWeight: '700', border: 'none', cursor: 'pointer', backgroundColor: repeatDays.includes(day) ? '#F68233' : '#F7F5F1', color: repeatDays.includes(day) ? '#263322' : '#ADADB3' }}>
                      {day[0]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={cancelForm} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1.5px solid #E4E1DB', backgroundColor: 'transparent', color: '#6B6B6E', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveReminder} disabled={saving || !title.trim()} style={{ flex: 2, padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none', backgroundColor: '#263322', color: '#F68233', cursor: 'pointer', opacity: saving || !title.trim() ? 0.5 : 1 }}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add reminder'}
              </button>
            </div>
          </div>
        )}

        {reminders.length === 0 && !adding && (
          <div style={{ textAlign: 'center', color: '#ADADB3', fontSize: '14px', marginTop: '40px' }}>No reminders yet</div>
        )}

        {reminders.map(rem => (
          <div key={rem.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '13px 15px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => toggleDone(rem.id, rem.done)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: rem.done ? 'none' : '1.5px solid #E4E1DB', backgroundColor: rem.done ? '#263322' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {rem.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: rem.done ? '#ADADB3' : '#18181A', textDecoration: rem.done ? 'line-through' : 'none' }}>{rem.title}</div>
                {repeatLabel(rem) && (
                  <div style={{ fontSize: '10px', color: '#ADADB3', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {(rem.repeatType && rem.repeatType !== 'none') && <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F68233', display: 'inline-block' }} />}
                    {repeatLabel(rem)}
                  </div>
                )}
              </div>
              <button onClick={() => startEdit(rem)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ADADB3', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => deleteReminder(rem.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ADADB3', fontSize: '18px', lineHeight: '1' }}>×</button>
            </div>
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
