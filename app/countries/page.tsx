'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState, useMemo } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'

function flag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

const COUNTRIES = [
  // Europe
  { code: 'AL', name: 'Albania' }, { code: 'AD', name: 'Andorra' }, { code: 'AT', name: 'Austria' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BA', name: 'Bosnia & Herzegovina' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' }, { code: 'XK', name: 'Kosovo' },
  { code: 'LV', name: 'Latvia' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MT', name: 'Malta' }, { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' }, { code: 'ME', name: 'Montenegro' }, { code: 'NL', name: 'Netherlands' },
  { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'SM', name: 'San Marino' }, { code: 'RS', name: 'Serbia' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'UA', name: 'Ukraine' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'VA', name: 'Vatican City' },
  // Americas
  { code: 'AG', name: 'Antigua & Barbuda' }, { code: 'AR', name: 'Argentina' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BB', name: 'Barbados' }, { code: 'BZ', name: 'Belize' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brazil' }, { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' },
  { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' },
  { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
  { code: 'JM', name: 'Jamaica' }, { code: 'MX', name: 'Mexico' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'PA', name: 'Panama' }, { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
  { code: 'KN', name: 'Saint Kitts & Nevis' }, { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'St Vincent & Grenadines' },
  { code: 'SR', name: 'Suriname' }, { code: 'TT', name: 'Trinidad & Tobago' }, { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  // Asia
  { code: 'AF', name: 'Afghanistan' }, { code: 'AM', name: 'Armenia' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BT', name: 'Bhutan' },
  { code: 'BN', name: 'Brunei' }, { code: 'KH', name: 'Cambodia' }, { code: 'CN', name: 'China' },
  { code: 'GE', name: 'Georgia' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IL', name: 'Israel' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
  { code: 'LB', name: 'Lebanon' }, { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
  { code: 'MN', name: 'Mongolia' }, { code: 'MM', name: 'Myanmar' }, { code: 'NP', name: 'Nepal' },
  { code: 'KP', name: 'North Korea' }, { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PS', name: 'Palestine' }, { code: 'PH', name: 'Philippines' }, { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SG', name: 'Singapore' }, { code: 'KR', name: 'South Korea' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' },
  { code: 'TR', name: 'Turkey' }, { code: 'TM', name: 'Turkmenistan' }, { code: 'AE', name: 'UAE' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' },
  // Africa
  { code: 'DZ', name: 'Algeria' }, { code: 'AO', name: 'Angola' }, { code: 'BJ', name: 'Benin' },
  { code: 'BW', name: 'Botswana' }, { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CV', name: 'Cabo Verde' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'DR Congo' }, { code: 'DJ', name: 'Djibouti' }, { code: 'EG', name: 'Egypt' },
  { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' }, { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GH', name: 'Ghana' }, { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'CI', name: 'Ivory Coast' }, { code: 'KE', name: 'Kenya' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' }, { code: 'ML', name: 'Mali' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' }, { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'RW', name: 'Rwanda' }, { code: 'ST', name: 'São Tomé & Príncipe' }, { code: 'SN', name: 'Senegal' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'South Sudan' }, { code: 'SD', name: 'Sudan' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'TG', name: 'Togo' }, { code: 'TN', name: 'Tunisia' },
  { code: 'UG', name: 'Uganda' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
  // Oceania
  { code: 'AU', name: 'Australia' }, { code: 'FJ', name: 'Fiji' }, { code: 'KI', name: 'Kiribati' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'FM', name: 'Micronesia' }, { code: 'NR', name: 'Nauru' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'PW', name: 'Palau' }, { code: 'PG', name: 'Papua New Guinea' },
  { code: 'WS', name: 'Samoa' }, { code: 'SB', name: 'Solomon Islands' }, { code: 'TO', name: 'Tonga' },
  { code: 'TV', name: 'Tuvalu' }, { code: 'VU', name: 'Vanuatu' },
].sort((a, b) => a.name.localeCompare(b.name))

type WishState = Record<string, { harry?: boolean; nicole?: boolean }>

export default function CountriesPage() {
  const { user } = useAuth()
  const isHarry = user?.email === HARRY_EMAIL
  const myKey = isHarry ? 'harry' : 'nicole'
  const otherKey = isHarry ? 'nicole' : 'harry'

  const [state, setState] = useState<WishState>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'both' | 'me' | 'them'>('all')

  useEffect(() => {
    return onSnapshot(doc(db, 'countries', 'wishlist'), snap => {
      if (snap.exists()) setState(snap.data() as WishState)
    })
  }, [])

  async function toggle(code: string) {
    if (!user) return
    const current = state[code]?.[myKey] ?? false
    const updated = { ...(state[code] || {}), [myKey]: !current }
    setState(prev => ({ ...prev, [code]: updated }))
    await setDoc(doc(db, 'countries', 'wishlist'), { [code]: updated }, { merge: true })
  }

  const counts = useMemo(() => {
    const both = COUNTRIES.filter(c => state[c.code]?.harry && state[c.code]?.nicole).length
    const me = COUNTRIES.filter(c => state[c.code]?.[myKey] && !state[c.code]?.[otherKey]).length
    const them = COUNTRIES.filter(c => !state[c.code]?.[myKey] && state[c.code]?.[otherKey]).length
    return { both, me, them }
  }, [state])

  const visible = useMemo(() => {
    return COUNTRIES.filter(c => {
      const s = state[c.code] || {}
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'both') return s.harry && s.nicole
      if (filter === 'me') return s[myKey] && !s[otherKey]
      if (filter === 'them') return !s[myKey] && s[otherKey]
      return true
    })
  }, [state, search, filter])

  const harryName = 'Harry'
  const nicoleName = 'Nicole'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <PageHeader title="Countries" />

      <div style={{ padding: '12px 16px 0' }}>
        {/* Hero counts */}
        <div style={{ backgroundColor: '#1E2B1C', borderRadius: '20px', padding: '16px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', color: '#F68233', lineHeight: '1' }}>{counts.both}</div>
            <div style={{ fontSize: '10px', color: '#6A9B63', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Both want</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', color: '#F68233', lineHeight: '1' }}>{counts.me}</div>
            <div style={{ fontSize: '10px', color: '#6A9B63', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Just me</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', color: '#F68233', lineHeight: '1' }}>{counts.them}</div>
            <div style={{ fontSize: '10px', color: '#6A9B63', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Just them</div>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search countries…"
          style={{ width: '100%', backgroundColor: '#fff', border: '1.5px solid #E4E1DB', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#18181A', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'system-ui' }}
        />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto' }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'both', label: '💚 Both want' },
            { key: 'me', label: '🧡 Just me' },
            { key: 'them', label: '🤍 Just them' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{ borderRadius: '100px', padding: '6px 13px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', backgroundColor: filter === t.key ? '#F68233' : '#E4E1DB', color: filter === t.key ? '#263322' : '#6B6B6E', flexShrink: 0 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Country list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {visible.map(c => {
            const s = state[c.code] || {}
            const iWant = s[myKey] ?? false
            const theyWant = s[otherKey] ?? false
            const both = iWant && theyWant
            return (
              <div
                key={c.code}
                onClick={() => toggle(c.code)}
                style={{ backgroundColor: both ? 'rgba(62,138,56,0.08)' : '#fff', borderRadius: '14px', padding: '11px 14px', border: `1.5px solid ${both ? 'rgba(62,138,56,0.25)' : 'rgba(0,0,0,0.07)'}`, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '26px', lineHeight: '1', flexShrink: 0 }}>{flag(c.code)}</span>
                <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#18181A' }}>{c.name}</div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  {/* Harry indicator */}
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: s.harry ? (both ? '#3E8A38' : '#F68233') : 'transparent', border: `1.5px solid ${s.harry ? 'transparent' : '#D0CCC4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: s.harry ? '#fff' : '#ADADB3' }}>H</div>
                  {/* Nicole indicator */}
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: s.nicole ? (both ? '#3E8A38' : '#F68233') : 'transparent', border: `1.5px solid ${s.nicole ? 'transparent' : '#D0CCC4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: s.nicole ? '#fff' : '#ADADB3' }}>N</div>
                </div>
              </div>
            )
          })}
          {visible.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ADADB3', fontSize: '14px', marginTop: '40px' }}>
              No countries match
            </div>
          )}
        </div>
      </div>
      <Nav />
    </div>
  )
}
