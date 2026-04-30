'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { useAuth } from './context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/home')
    } catch {
      setError('Wrong email or password. Try again.')
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-[#EFECEA] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#263322] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 27C16 27 5 20 5 12.5C5 9.2 7.7 6.5 11 6.5C13 6.5 14.8 7.5 16 9C17.2 7.5 19 6.5 21 6.5C24.3 6.5 27 9.2 27 12.5C27 20 16 27 16 27Z" stroke="#F68233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="font-serif text-3xl text-[#18181A]">Haz <em className="text-[#F68233]">&</em> Nix</h1>
          <p className="text-sm text-[#ADADB3] mt-2">Just for us</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3.5 text-sm text-[#18181A] placeholder:text-[#ADADB3] outline-none focus:border-[#F68233] transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3.5 text-sm text-[#18181A] placeholder:text-[#ADADB3] outline-none focus:border-[#F68233] transition-colors"
            required
          />
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#263322] text-[#F68233] rounded-xl py-3.5 text-sm font-semibold mt-2 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}