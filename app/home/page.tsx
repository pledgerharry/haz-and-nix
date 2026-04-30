'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/')
    }
  }, [user, loading, router, mounted])

  if (!mounted || loading || !user) return null

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#EFECEA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '32px',
          color: '#18181A',
          marginBottom: '8px'
        }}>
          You're in 💚
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6E', marginBottom: '32px' }}>
          Logged in as {user.email}
        </p>
        <button
          onClick={() => signOut(auth).then(() => router.push('/'))}
          style={{
            fontSize: '14px',
            color: '#F68233',
            fontWeight: '500',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}