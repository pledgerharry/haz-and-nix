'use client'

import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { useAuth } from './context'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.push('/home')
  }, [user, loading, router])

  if (loading) return <div style={{minHeight:'100vh',backgroundColor:'#EFECEA'}} />

  async function handleLogin(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/home')
    } catch {
      setError('Wrong email or password.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#EFECEA',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:'360px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{width:'64px',height:'64px',backgroundColor:'#263322',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 27C16 27 5 20 5 12.5C5 9.2 7.7 6.5 11 6.5C13 6.5 14.8 7.5 16 9C17.2 7.5 19 6.5 21 6.5C24.3 6.5 27 9.2 27 12.5C27 20 16 27 16 27Z" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 style={{fontSize:'32px',color:'#18181A',margin:'0 0 8px',fontFamily:'Georgia,serif'}}>Haz <em style={{color:'#F68233'}}>&amp;</em> Nix</h1>
          <p style={{fontSize:'14px',color:'#ADADB3',margin:0}}>Just for us</p>
        </div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',backgroundColor:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'12px',padding:'14px 16px',fontSize:'14px',color:'#18181A',outline:'none',marginBottom:'10px',display:'block',boxSizing:'border-box'}} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:'100%',backgroundColor:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'12px',padding:'14px 16px',fontSize:'14px',color:'#18181A',outline:'none',marginBottom:'10px',display:'block',boxSizing:'border-box'}} />
          {error && <p style={{color:'#e53e3e',fontSize:'12px',marginBottom:'10px'}}>{error}</p>}
          <button type="submit" disabled={submitting} style={{width:'100%',backgroundColor:'#263322',color:'#F68233',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'600',cursor:'pointer',opacity:submitting?0.5:1}}>{submitting?'Signing in...':'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}