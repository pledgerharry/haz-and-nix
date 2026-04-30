'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function Nav() {
  const router = useRouter()
  const path = usePathname()

  const items = [
    { href: '/home', label: 'Home', icon: '🏠' },
    { href: '/dates', label: 'Dates', icon: '📍' },
    { href: '/snap', label: 'Snap', icon: '📸' },
    { href: '/more', label: 'More', icon: '••••' },
  ]

  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,backgroundColor:'#fff',borderTop:'1px solid rgba(0,0,0,0.07)',padding:'8px 4px 24px',display:'flex',justifyContent:'space-around',zIndex:100}}>
      {items.map(item => (
        <button key={item.href} onClick={() => router.push(item.href)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',padding:'4px 14px',borderRadius:'14px',border:'none',backgroundColor:'transparent',cursor:'pointer',fontFamily:'system-ui'}}>
          <span style={{fontSize:'20px',lineHeight:'1'}}>{item.icon}</span>
          <span style={{fontSize:'9px',fontWeight:'500',color:path===item.href?'#F68233':'#ADADB3'}}>{item.label}</span>
          <span style={{width:'4px',height:'4px',borderRadius:'50%',backgroundColor:path===item.href?'#F68233':'transparent'}}></span>
        </button>
      ))}
    </div>
  )
}
