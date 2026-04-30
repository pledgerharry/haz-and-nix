'use client'

import { useAuth } from '../context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (typeof window === 'undefined') return null
  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-[#EFECEA] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-[#18181A] mb-2">You're in 💚</h1>
        <p className="text-sm text-[#6B6B6E] mb-8">Logged in as {user.email}</p>
        <button
          onClick={() => signOut(auth).then(() => router.push('/'))}
          className="text-sm text-[#F68233] font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}