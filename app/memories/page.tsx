'use client'
import { useRouter } from 'next/navigation'
import Nav from '../components/Nav'

export default function Page() {
  const router = useRouter()
  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
        <button onClick={() => router.back()} style={{width:'32px',height:'32px',borderRadius:'10px',backgroundColor:'#E4E1DB',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>Memories</h1>
      </div>
      <div style={{padding:'0 16px',textAlign:'center',color:'#ADADB3',fontSize:'14px',marginTop:'40px'}}>Coming soon</div>
      <Nav />
    </div>
  )
}
