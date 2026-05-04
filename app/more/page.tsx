'use client'
import { useRouter } from 'next/navigation'
import Nav from '../components/Nav'

export default function MorePage() {
  const router = useRouter()

  const games = [
    { href: '/wordgame', icon: '🔤', title: 'Word game', sub: 'Daily head-to-head' },
    { href: '/wyr', icon: '🤔', title: 'Would you rather', sub: 'New question ready' },
    { href: '/interview', icon: '📋', title: 'Interview mode', sub: 'Silly job interviews' },
  ]

  const us = [
    { href: '/stats', icon: '📊', title: 'Relationship stats', sub: 'Days together and more' },
    { href: '/bucket', icon: '✅', title: 'Bucket list', sub: 'Things to do together' },
    { href: '/memories', icon: '🖼️', title: 'Memories', sub: 'Photos and videos' },
    { href: '/dreams', icon: '🌙', title: 'Dream log', sub: 'Shared dreams' },
    { href: '/reminders', icon: '🔔', title: 'Reminders', sub: 'Shared reminders' },
  ]

  const watchlist = [
    { href: '/movies', icon: '🎬', title: 'Movie wishlist', sub: '34 films to watch' },
  ]

  const Row = ({ href, icon, title, sub }: any) => (
    <div onClick={() => router.push(href)} style={{backgroundColor:'#fff',borderRadius:'14px',padding:'13px 14px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',marginBottom:'7px',border:'1px solid rgba(0,0,0,0.07)'}}>
      <div style={{width:'34px',height:'34px',borderRadius:'10px',backgroundColor:'rgba(246,130,51,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:'13px',fontWeight:'500',color:'#18181A'}}>{title}</div>
        <div style={{fontSize:'11px',color:'#ADADB3',marginTop:'2px'}}>{sub}</div>
      </div>
      <span style={{color:'#ADADB3',fontSize:'18px'}}>›</span>
    </div>
  )

  const SectionLabel = ({ label }: any) => (
    <div style={{fontSize:'10px',fontWeight:'600',letterSpacing:'0.09em',textTransform:'uppercase',color:'#ADADB3',padding:'4px 2px 6px'}}>{label}</div>
  )

  return (
    <div style={{minHeight:'100vh',backgroundColor:'#F7F5F1',fontFamily:'system-ui,sans-serif',paddingBottom:'80px'}}>
      <div style={{padding:'16px 20px 16px'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'21px',color:'#18181A'}}>More</h1>
      </div>
      <div style={{padding:'0 16px'}}>
        <SectionLabel label="🎮 Games & fun" />
        {games.map(g => <Row key={g.href} {...g} />)}
        <SectionLabel label="💑 Us" />
        {us.map(g => <Row key={g.href} {...g} />)}
        <SectionLabel label="🎬 Watchlist" />
        {watchlist.map(g => <Row key={g.href} {...g} />)}
      </div>
      <Nav />
    </div>
  )
}
