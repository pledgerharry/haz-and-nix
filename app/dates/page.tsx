'use client'
import { useAuth } from '../context'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState, useMemo } from 'react'
import Nav from '../components/Nav'
import PageHeader from '../components/PageHeader'

const HARRY_EMAIL = 'harrypledger@hotmail.com'
const TODAY = new Date().toISOString().split('T')[0]

type DailySugg = { title: string; description: string; location: string; budget: string; type: string }

// Map AI-returned type to adaptive pool tags so learning still works
const TYPE_TAGS: Record<string, string[]> = {
  'Food & drink': ['food', 'experience'],
  'Outdoor':      ['outdoors', 'adventure'],
  'Cultural':     ['culture', 'experience'],
  'Cosy':         ['relaxed', 'romantic'],
  'Day trip':     ['uk_day', 'outdoors'],
  'Remote':       ['experience', 'relaxed'],
}

const inp: React.CSSProperties = {
  width: '100%', backgroundColor: '#F7F5F1', border: '1.5px solid #E4E1DB',
  borderRadius: '11px', padding: '10px 12px', fontSize: '13px', color: '#18181A',
  outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'system-ui',
}

type Sugg = { title: string; location: string; desc: string; tags: string[] }

const POOL: Sugg[] = [
  // Cambridge & nearby
  { title: 'Punting on the Cam', location: 'Cambridge', desc: 'Rent a punt for an evening and glide down the Backs past King\'s College — magical at golden hour.', tags: ['local', 'outdoors', 'romantic'] },
  { title: 'Grantchester meadows & pub', location: 'Cambridge', desc: 'Walk the river path out to Grantchester, pint at The Rupert Brooke, stroll back. Classic.', tags: ['local', 'outdoors', 'food'] },
  { title: 'Cambridge Botanic Garden picnic', location: 'Cambridge', desc: 'Pack a picnic and spend an afternoon in one of the best botanical gardens in the UK.', tags: ['local', 'outdoors', 'romantic', 'relaxed'] },
  { title: 'Ely Cathedral & riverside lunch', location: 'Ely', desc: '20 mins from Cambridge — stunning Norman cathedral, then lunch by the Great Ouse.', tags: ['local', 'culture'] },
  { title: 'Stargazing picnic', location: 'Countryside near Cambridge', desc: 'Drive out beyond the light pollution, bring blankets, a flask, and look up.', tags: ['local', 'outdoors', 'romantic'] },
  { title: 'Wild swimming at Byron\'s Pool', location: 'Grantchester', desc: 'The same spot where Virginia Woolf and Rupert Brooke swam. Serene and wild.', tags: ['local', 'outdoors', 'adventure'] },
  { title: 'Audley End House & gardens', location: 'Saffron Walden', desc: 'One of England\'s grandest Jacobean houses, 30 mins from Cambridge. Walk the grounds.', tags: ['local', 'culture', 'outdoors'] },
  // Croydon & south London
  { title: 'Crystal Palace Park & dinosaurs', location: 'Crystal Palace', desc: 'Walk around the park, find the full-size Victorian dinosaur sculptures, get coffee in the village.', tags: ['south_london', 'outdoors', 'fun'] },
  { title: 'Brockwell Lido', location: 'Herne Hill', desc: 'Outdoor lido in south London — swim, sunbathe, café after. One of London\'s best summer dates.', tags: ['south_london', 'outdoors', 'relaxed'] },
  { title: 'Maltby Street Market brunch', location: 'Bermondsey', desc: 'A tiny arched market street with some of London\'s best food stalls. Go hungry, Saturday morning.', tags: ['south_london', 'food'] },
  // London day out
  { title: 'Borough Market + South Bank walk', location: 'London Bridge', desc: 'Graze around Borough, then walk west along the South Bank past Tate Modern to Waterloo.', tags: ['london', 'food', 'outdoors'] },
  { title: 'Kew Gardens', location: 'Richmond', desc: 'A full day in the world\'s most famous botanical garden — spectacular in spring or autumn.', tags: ['london', 'outdoors', 'romantic'] },
  { title: 'Hampton Court Palace', location: 'East Molesey', desc: 'Henry VIII\'s palace, the famous maze, and beautiful riverside grounds. Historic and brilliant.', tags: ['london', 'culture', 'outdoors'] },
  { title: 'Richmond Park deer walk', location: 'Richmond', desc: 'Early morning or golden hour walk through one of London\'s wildest parks to spot the fallow deer.', tags: ['london', 'outdoors', 'romantic'] },
  { title: 'Sky Garden', location: 'City of London', desc: 'Free tickets to the highest public garden in London. Breathtaking views, especially at dusk.', tags: ['london', 'culture', 'romantic'] },
  { title: 'Columbia Road flower market', location: 'East London', desc: 'Sunday morning market — chaotic, colourful, and brilliant. Get there before 10am.', tags: ['london', 'food', 'culture'] },
  { title: 'Thames river cruise', location: 'London', desc: 'Hop on a TfL clipper from Westminster to Greenwich — great views the whole way for £5.', tags: ['london', 'outdoors', 'culture'] },
  { title: 'Greenwich & Cutty Sark', location: 'Greenwich', desc: 'Stand on the meridian line, visit the Cutty Sark, walk up to the Observatory for the view.', tags: ['london', 'culture', 'outdoors'] },
  { title: 'Tate Modern + Turbine Hall', location: 'South Bank', desc: 'Free entry to one of the world\'s great modern art galleries. Always something unexpected inside.', tags: ['london', 'culture'] },
  // UK day trips
  { title: 'Brighton beach & Lanes', location: 'Brighton', desc: 'Seafood on the beach, walk the pier, explore the quirky Lanes, fish & chips at sunset.', tags: ['uk_day', 'food', 'outdoors'] },
  { title: 'Seven Sisters clifftop walk', location: 'East Sussex', desc: 'The most dramatic coastal walk in England — white chalk cliffs along the Channel. About 7 miles.', tags: ['uk_day', 'outdoors', 'adventure'] },
  { title: 'Whitstable oysters & beach', location: 'Whitstable', desc: 'Quaint harbour town famous for native oysters. Eat them on the shingle, walk the beach.', tags: ['uk_day', 'food', 'outdoors'] },
  { title: 'Oxford punting & dinner', location: 'Oxford', desc: 'Punt on the Cherwell, walk the colleges, then dinner in Jericho neighbourhood.', tags: ['uk_day', 'culture', 'outdoors', 'romantic'] },
  { title: 'Bath & Roman Baths', location: 'Bath', desc: 'Georgian architecture, Roman Baths, the Thermae Spa, and some of England\'s best restaurants.', tags: ['uk_day', 'culture', 'food'] },
  { title: 'Rye old town wander', location: 'Rye, East Sussex', desc: 'One of England\'s best-preserved medieval towns — cobblestone streets, great pubs, no tourists.', tags: ['uk_day', 'culture', 'relaxed'] },
  // UK weekends
  { title: 'Cotswolds village weekend', location: 'Bourton-on-the-Water / Burford', desc: 'Drive the Cotswolds, stop for lunch at a village pub, walk honey-stone lanes.', tags: ['uk_weekend', 'outdoors', 'romantic', 'food'] },
  { title: 'Peak District hiking', location: 'Derbyshire', desc: 'Mam Tor, Stanage Edge, or Dovedale — some of England\'s best walking. Stay in Bakewell.', tags: ['uk_weekend', 'outdoors', 'adventure'] },
  { title: 'Cornwall beach weekend', location: 'Cornwall', desc: 'St Ives, Porthcurno, or Kynance Cove — wild Atlantic beaches and the freshest seafood.', tags: ['uk_weekend', 'outdoors', 'food', 'romantic'] },
  { title: 'Edinburgh long weekend', location: 'Edinburgh', desc: 'Old Town, Arthur\'s Seat, the castle, whisky bars. One of Europe\'s best city breaks by far.', tags: ['uk_weekend', 'culture', 'food', 'adventure'] },
  { title: 'Lake District', location: 'Cumbria', desc: 'Coniston, Windermere, Scafell Pike — endlessly beautiful. Rent a cottage and switch off.', tags: ['uk_weekend', 'outdoors', 'romantic', 'adventure'] },
  // Europe
  { title: 'Paris Eurostar weekend', location: 'Paris', desc: '2h15 from St Pancras. Montmartre walk, Seine at night, great wine, absurdly good croissants.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Amsterdam weekend', location: 'Amsterdam', desc: 'Canal walks, Rijksmuseum, the Jordaan neighbourhood, Stroopwafels and Jenever.', tags: ['europe', 'culture', 'food'] },
  { title: 'Lisbon & pastéis de nata', location: 'Lisbon', desc: 'Trams, Alfama at night, rooftop bars, the best egg tarts in the world. Warm even in winter.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Seville in spring', location: 'Seville', desc: 'Orange trees lining every street, flamenco bars, tapas, and the extraordinary Alcázar palace.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Copenhagen weekend', location: 'Copenhagen', desc: 'Nyhavn canal, open-faced sandwiches, Tivoli Gardens, beautiful Scandi design everywhere.', tags: ['europe', 'culture', 'food'] },
  { title: 'Prague weekend', location: 'Prague', desc: 'Fairytale old town, incredible beer, cheap restaurants, and streets without the Paris crowds.', tags: ['europe', 'culture', 'food'] },
  { title: 'Barcelona & architecture', location: 'Barcelona', desc: 'Gaudí everywhere, La Boqueria, Gothic quarter, beach, and late dinners at 10pm.', tags: ['europe', 'culture', 'food', 'outdoors'] },
  { title: 'Rome weekend', location: 'Rome', desc: 'Colosseum, Trastevere neighbourhood for dinner, cacio e pepe, Piazza Navona at night.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Dublin weekend', location: 'Dublin', desc: 'Trinity College, Temple Bar, Guinness Storehouse, and some of the friendliest pubs in the world.', tags: ['europe', 'culture', 'food'] },
  { title: 'Reykjavik & Northern Lights', location: 'Iceland', desc: 'Hot springs, lava fields, whale watching, and if you\'re lucky the aurora borealis.', tags: ['europe', 'outdoors', 'adventure', 'romantic'] },
  // Experiences
  { title: 'Cocktail making class', location: 'Cambridge / London', desc: 'Learn to shake 3–4 classics, then drink them. Brilliant for a weekday evening.', tags: ['experience', 'food', 'fun'] },
  { title: 'Pottery class', location: 'Cambridge / London', desc: 'Two hours throwing pots together. Meditative, messy, and consistently more fun than expected.', tags: ['experience', 'romantic', 'fun'] },
  { title: 'Escape room', location: 'Cambridge / London', desc: 'Lock yourselves in and solve it together. A surprisingly revealing test of teamwork.', tags: ['experience', 'adventure', 'fun'] },
  { title: 'Go-karting', location: 'Cambridge / Croydon', desc: 'Race each other properly round the track. Competitive and genuinely exhilarating.', tags: ['experience', 'adventure', 'fun'] },
  { title: 'Comedy club', location: 'London', desc: 'The Comedy Store, Up The Creek, or Soho Theatre. Live stand-up is a great date night.', tags: ['experience', 'culture', 'fun'] },
  { title: 'Live jazz at Ronnie Scott\'s', location: 'Soho, London', desc: 'The most famous jazz club in the world. Intimate, atmospheric, and brilliant.', tags: ['experience', 'culture', 'romantic'] },
  { title: 'Spa day', location: 'London / Cambridge', desc: 'Thermae Bath Spa, or a London day spa. Sauna, pool, steam, lunch. Total reset together.', tags: ['experience', 'relaxed', 'romantic'] },
  { title: 'Afternoon tea', location: 'London / Cambridge', desc: 'Finger sandwiches, scones with clotted cream, champagne. Properly indulgent.', tags: ['experience', 'food', 'relaxed', 'romantic'] },
  { title: 'Gin distillery tour', location: 'Cambridge Distillery', desc: 'Tour the Cambridge Distillery, learn how gin is made, taste a lot of gin.', tags: ['experience', 'food', 'fun', 'local'] },
  { title: 'Axe throwing', location: 'London / Cambridge', desc: 'Surprisingly therapeutic and competitive. Great for a midweek evening.', tags: ['experience', 'adventure', 'fun'] },
  { title: 'Rooftop bar night', location: 'London', desc: 'Peckham Levels, Roof East, Seabird, or Madison — London has incredible rooftop bars.', tags: ['experience', 'food', 'romantic', 'london'] },
  { title: 'Karaoke night', location: 'London / Cambridge', desc: 'A private karaoke room for two. No audience, no shame, just fun.', tags: ['experience', 'fun'] },
  // East Anglia
  { title: 'Holkham Beach & Wells-next-the-Sea', location: 'North Norfolk', desc: 'One of England\'s most beautiful beaches — vast, wild, and backed by pines. Then fish & chips in Wells.', tags: ['east_anglia', 'outdoors', 'food', 'romantic'] },
  { title: 'Blakeney seal boat trip', location: 'Blakeney, Norfolk', desc: 'Board a boat from Blakeney Quay to see hundreds of grey seals basking on Blakeney Point.', tags: ['east_anglia', 'outdoors', 'adventure'] },
  { title: 'Cromer crab & pier', location: 'Cromer, Norfolk', desc: 'Famous for its crabs — eat a dressed crab on the Victorian pier. Bracing, brilliant, very Norfolk.', tags: ['east_anglia', 'food', 'outdoors'] },
  { title: 'Southwold & Adnams', location: 'Southwold, Suffolk', desc: 'Charming seaside town, pastel beach huts, the Adnams brewery, and a proper seaside pub lunch.', tags: ['east_anglia', 'food', 'outdoors', 'relaxed'] },
  { title: 'Lavenham medieval village', location: 'Lavenham, Suffolk', desc: 'The most complete medieval wool town in England. Wonky timber-framed buildings and zero tourists midweek.', tags: ['east_anglia', 'culture', 'outdoors'] },
  { title: 'Norwich Cathedral & the Lanes', location: 'Norwich', desc: 'Beautiful Norman cathedral, brilliant indie shops in the Lanes, and a genuinely great food scene.', tags: ['east_anglia', 'culture', 'food'] },
  { title: 'Bury St Edmunds & abbey ruins', location: 'Bury St Edmunds, Suffolk', desc: 'Handsome market town with ruined abbey gardens, a great market, and excellent pubs.', tags: ['east_anglia', 'culture', 'food'] },
  { title: 'Norfolk Broads day boat', location: 'Wroxham / Potter Heigham', desc: 'Hire a small motor cruiser for a day and pootle through the reed-lined waterways. Peaceful and totally unique.', tags: ['east_anglia', 'outdoors', 'relaxed', 'adventure'] },
  // South London & SE England (from Croydon)
  { title: 'Box Hill walk & pub', location: 'Surrey Hills', desc: 'One of the best walks in SE England — steep climb to the top, views across the Weald, pub at the bottom.', tags: ['south_east', 'outdoors', 'food'] },
  { title: 'Dulwich Picture Gallery', location: 'Dulwich, SE London', desc: 'England\'s oldest public art gallery, designed by Sir John Soane. Small, beautiful, and free most of the time.', tags: ['south_london', 'culture', 'relaxed'] },
  { title: 'Margate — Turner & Dreamland', location: 'Margate, Kent', desc: 'The Turner Contemporary, the revived Dreamland fairground, brilliant new restaurants, and a great beach. Kent\'s coolest town.', tags: ['south_east', 'culture', 'food', 'fun'] },
  { title: 'Canterbury Cathedral & old town', location: 'Canterbury, Kent', desc: 'One of England\'s great Gothic cathedrals, a beautiful medieval city, and great restaurants in the old streets.', tags: ['south_east', 'culture', 'food'] },
  { title: 'Hastings Old Town & fish', location: 'Hastings, East Sussex', desc: 'Bohemian old town, the highest concentration of independent shops in the UK, fish straight off the boats.', tags: ['south_east', 'food', 'culture', 'outdoors'] },
  { title: 'Folkestone Creative Quarter', location: 'Folkestone, Kent', desc: 'Clifftop walks, a thriving arts quarter, the best chip shop in Kent, and White Cliffs views.', tags: ['south_east', 'culture', 'outdoors'] },
  { title: 'Dungeness', location: 'Dungeness, Kent', desc: 'The most otherworldly place in England — a vast shingle desert, Derek Jarman\'s garden, two lighthouses. Eerie and unforgettable.', tags: ['south_east', 'outdoors', 'culture', 'adventure'] },
  { title: 'Epsom Derby day', location: 'Epsom Downs, Surrey', desc: '30 mins from Croydon — get dressed up and have a flutter at one of England\'s great race meetings.', tags: ['south_east', 'south_london', 'fun', 'culture'] },
  // UK curveballs
  { title: 'Bristol harbourside & Clifton', location: 'Bristol', desc: 'Clifton Suspension Bridge, the harbourside food scene, Banksy\'s home turf, and some of the best restaurants outside London. 2h from either of you.', tags: ['uk_city', 'food', 'culture', 'outdoors'] },
  { title: 'Manchester — Northern Quarter', location: 'Manchester', desc: 'The Northern Quarter\'s independent bars and restaurants, a match at Old Trafford or the Etihad, incredible food. 2.5h by train.', tags: ['uk_city', 'food', 'culture', 'fun'] },
  { title: 'York — Shambles & walls', location: 'York', desc: 'Walk the medieval city walls, get lost in The Shambles, and eat at one of England\'s best independent food scenes.', tags: ['uk_city', 'culture', 'food', 'romantic'] },
  { title: 'Liverpool — Albert Dock & culture', location: 'Liverpool', desc: 'The Beatles Story, Tate Liverpool, the Albert Dock, and the warmest city in England. 3h from either of you.', tags: ['uk_city', 'culture', 'food', 'fun'] },
  { title: 'Hay-on-Wye book town', location: 'Hay-on-Wye, Wales', desc: 'The world\'s second-hand bookshop capital — dozens of shops, a small castle, and the Brecon Beacons on your doorstep.', tags: ['wales', 'culture', 'outdoors', 'relaxed'] },
  { title: 'Pembrokeshire coast', location: 'Pembrokeshire, Wales', desc: 'Barafundle Bay, Freshwater West, St David\'s Cathedral — arguably the best coastline in Britain. Worth every mile of the drive.', tags: ['wales', 'outdoors', 'adventure', 'romantic'] },
  { title: 'Snowdonia & zip wire', location: 'Snowdonia, Wales', desc: 'Climb Snowdon or take the railway, then hurtle down Zip World — the fastest zip wire in the world.', tags: ['wales', 'outdoors', 'adventure'] },
  { title: 'Bristol to Bath day', location: 'Bristol / Bath', desc: 'Train to Bristol for the morning, bus to Bath for the afternoon — Thermae Spa, Roman Baths, great dinner.', tags: ['uk_city', 'culture', 'food', 'relaxed'] },
  { title: 'Bruges day trip', location: 'Bruges, Belgium', desc: 'St Pancras → Eurostar to Brussels, train to Bruges — 2.5h door-to-door. Medieval canals, waffles, Belgian beer, chocolate.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Porto & wine', location: 'Porto, Portugal', desc: 'Budget flights from Stansted, Douro riverfront, port wine lodges, and the most beautiful azulejo tiles anywhere.', tags: ['europe', 'culture', 'food', 'romantic'] },
  { title: 'Glastonbury Tor & Cheddar Gorge', location: 'Somerset', desc: 'Climb Glastonbury Tor at sunrise, then explore the dramatic Cheddar Gorge. Otherworldly and underrated.', tags: ['uk_day', 'outdoors', 'adventure', 'culture'] },
  { title: 'Portsmouth Historic Dockyard', location: 'Portsmouth', desc: 'HMS Victory, the Mary Rose, Spinnaker Tower views — a brilliant day out by the sea.', tags: ['uk_day', 'culture', 'outdoors'] },
  // Experiences — urban & spontaneous
  { title: 'Get a flash tattoo together', location: 'London', desc: 'Walk into a studio in Shoreditch or Soho, pick a flash design off the wall, and get inked. Spontaneous and something you\'ll have forever.', tags: ['experience', 'adventure', 'fun', 'london'] },
  { title: 'Live comedy night', location: 'London', desc: 'Up The Creek in Greenwich, the Comedy Store, or Soho Theatre. Live stand-up is one of the best date nights going — book ahead.', tags: ['experience', 'culture', 'fun', 'london'] },
  { title: 'Ceramics painting class', location: 'London / Cambridge', desc: 'Pick a pot, mug, or plate, and paint it together. Relaxed, creative, and you get to take it home.', tags: ['experience', 'fun', 'relaxed', 'romantic'] },
  { title: 'Karaoke night', location: 'London / Cambridge', desc: 'Book a private room — Lucky Voice, Lucky Karaoke, or MAST. No audience, no shame, maximum fun.', tags: ['experience', 'fun', 'romantic'] },
  { title: 'West End show', location: 'London', desc: 'Get last-minute tickets from the TKTS booth in Leicester Square on the day. Pick something you wouldn\'t normally choose.', tags: ['experience', 'culture', 'romantic', 'london'] },
  { title: 'Night at the greyhounds', location: 'Catford Stadium, SE London', desc: '20 mins from Croydon — pick a dog, place a £2 bet, eat a pie, cheer loudly. Retro and absolutely brilliant.', tags: ['experience', 'fun', 'south_london', 'food'] },
  { title: 'Sunrise hike', location: 'Surrey Hills / Chilterns', desc: 'Set an alarm, drive to a hill — Box Hill or the Chiltern ridgeway — and watch the sun come up together with a flask of tea.', tags: ['experience', 'outdoors', 'romantic', 'adventure'] },
  { title: 'Vinyl record shopping', location: 'Portobello / Soho, London', desc: 'Spend an afternoon hunting through record crates at Rough Trade, Sounds of the Universe, or Portobello Market. Pick one to listen to together that evening.', tags: ['experience', 'culture', 'fun', 'london'] },
  { title: 'Open-air cinema', location: 'London', desc: 'Luna Cinema, Rooftop Film Club, or Screen on the Green — outdoor films in summer. Take a blanket and snacks.', tags: ['experience', 'culture', 'romantic', 'london'] },
  { title: 'Life drawing class', location: 'London / Cambridge', desc: 'Surprisingly fun, slightly absurd, and a proper talking point. Many venues run drop-in evenings with wine included.', tags: ['experience', 'culture', 'fun'] },
]

type Decisions = { dismissed: string[]; likedTags: string[]; dislikedTags: string[] }

export default function DatesPage() {
  const { user } = useAuth()
  const [dates, setDates] = useState<any[]>([])
  const [decisions, setDecisions] = useState<Decisions>({ dismissed: [], likedTags: [], dislikedTags: [] })
  const [tab, setTab] = useState<'pending' | 'approved' | 'done'>('pending')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const isHarry = user?.email === HARRY_EMAIL

  useEffect(() => {
    const q = query(collection(db, 'dates'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setDates(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  useEffect(() => {
    return onSnapshot(doc(db, 'suggestions', 'decisions'), snap => {
      if (snap.exists()) setDecisions(snap.data() as Decisions)
    })
  }, [])

  const [dailySugg, setDailySugg] = useState<DailySugg | null>(null)
  useEffect(() => {
    return onSnapshot(doc(db, 'dateSuggestions', TODAY), snap => {
      if (snap.exists()) setDailySugg(snap.data() as DailySugg)
    })
  }, [])

  const existingTitles = useMemo(() => new Set(dates.map(d => d.title)), [dates])

  // Daily AI suggestion — shown first if it hasn't been acted on
  const visibleDaily = useMemo(() => {
    if (!dailySugg) return null
    if (new Set(decisions.dismissed).has(dailySugg.title)) return null
    if (existingTitles.has(dailySugg.title)) return null
    return dailySugg
  }, [dailySugg, decisions.dismissed, existingTitles])

  // Shuffle once on mount so the initial pool isn't always Cambridge-first
  const shuffledPool = useMemo(() => [...POOL].sort(() => Math.random() - 0.5), [])

  const suggestions = useMemo(() => {
    const { dismissed, likedTags, dislikedTags } = decisions
    const dismissedSet = new Set(dismissed)
    return shuffledPool
      .filter(s => !dismissedSet.has(s.title) && !existingTitles.has(s.title))
      .map(s => {
        const score = s.tags.reduce((acc, tag) => {
          if (likedTags.includes(tag)) return acc + 2
          if (dislikedTags.includes(tag)) return acc - 2
          return acc
        }, 0)
        return { ...s, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, visibleDaily ? 4 : 5)
  }, [decisions, existingTitles, shuffledPool, visibleDaily])

  async function saveDecisions(update: Partial<Decisions>) {
    const next = { ...decisions, ...update }
    setDecisions(next)
    await setDoc(doc(db, 'suggestions', 'decisions'), next, { merge: true })
  }

  async function approveSuggestion(s: Sugg) {
    await addDoc(collection(db, 'dates'), {
      title: s.title, location: s.location, desc: s.desc,
      addedBy: 'Suggested', status: 'pending', createdAt: serverTimestamp(),
    })
    await saveDecisions({
      dismissed: [...decisions.dismissed, s.title],
      likedTags: [...new Set([...decisions.likedTags, ...s.tags])],
    })
  }

  async function dismissSuggestion(s: Sugg) {
    await saveDecisions({
      dismissed: [...decisions.dismissed, s.title],
      dislikedTags: [...new Set([...decisions.dislikedTags, ...s.tags])],
    })
  }

  async function doneSuggestion(s: Sugg) {
    await addDoc(collection(db, 'dates'), {
      title: s.title, location: s.location, desc: s.desc,
      addedBy: 'Suggested', status: 'done', createdAt: serverTimestamp(),
    })
    await saveDecisions({
      dismissed: [...decisions.dismissed, s.title],
      likedTags: [...new Set([...decisions.likedTags, ...s.tags])],
    })
  }

  // Convert a daily AI suggestion into a Sugg-shaped object so we can reuse the same action functions
  function dailyToSugg(d: DailySugg): Sugg {
    return { title: d.title, location: d.location, desc: d.description, tags: TYPE_TAGS[d.type] ?? ['experience'] }
  }

  function startAdd() { setTitle(''); setLocation(''); setDesc(''); setEditingId(null); setAdding(true) }
  function startEdit(d: any) { setTitle(d.title || ''); setLocation(d.location || ''); setDesc(d.desc || ''); setEditingId(d.id); setAdding(true) }
  function cancelForm() { setAdding(false); setEditingId(null); setTitle(''); setLocation(''); setDesc('') }

  async function saveDate() {
    if (!title.trim() || !user) return
    setSaving(true)
    if (editingId) {
      await updateDoc(doc(db, 'dates', editingId), { title: title.trim(), location: location.trim(), desc: desc.trim() })
    } else {
      await addDoc(collection(db, 'dates'), {
        title: title.trim(), location: location.trim(), desc: desc.trim(),
        addedBy: isHarry ? 'Harry' : 'Nicole', status: 'pending', createdAt: serverTimestamp(),
      })
    }
    cancelForm(); setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await updateDoc(doc(db, 'dates', id), { status })
  }

  const filtered = dates.filter(d => d.status === tab)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F5F1', fontFamily: 'system-ui,sans-serif', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <PageHeader title="Date wishlist" right={
        <button onClick={startAdd} style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#263322', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F68233', fontSize: '22px', fontWeight: '300', lineHeight: '1' }}>+</button>
      } />

      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px 12px', overflowX: 'auto' }}>
        {(['pending', 'approved', 'done'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ borderRadius: '100px', padding: '6px 14px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', backgroundColor: tab === t ? '#F68233' : '#E4E1DB', color: tab === t ? '#263322' : '#6B6B6E' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({dates.filter(d => d.status === t).length})
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {adding && (
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#18181A', marginBottom: '10px' }}>{editingId ? 'Edit date idea' : 'Add a date idea'}</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the idea?" style={inp} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (Cambridge, London…)" style={inp} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tell them a bit more (optional)" style={{ ...inp, marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={cancelForm} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1.5px solid #E4E1DB', backgroundColor: 'transparent', color: '#6B6B6E', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveDate} disabled={saving || !title.trim()} style={{ flex: 2, padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', border: 'none', backgroundColor: '#263322', color: '#F68233', cursor: 'pointer', opacity: saving || !title.trim() ? 0.5 : 1 }}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add idea'}
              </button>
            </div>
          </div>
        )}

        {/* Suggestion cards — only shown in pending tab */}
        {tab === 'pending' && (visibleDaily || suggestions.length > 0) && (
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#ADADB3', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>✨ Suggested for you</div>

            {/* Daily AI-generated suggestion — first card */}
            {visibleDaily && (
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(246,130,51,0.3)', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#18181A', flex: 1 }}>{visibleDaily.title}</div>
                  <div style={{ fontSize: '9px', fontWeight: '700', backgroundColor: '#F68233', color: '#263322', borderRadius: '100px', padding: '2px 7px', whiteSpace: 'nowrap' }}>TODAY</div>
                </div>
                <div style={{ fontSize: '11px', color: '#F68233', marginBottom: '4px' }}>📍 {visibleDaily.location}</div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '500', backgroundColor: '#F7F5F1', color: '#6B6B6E', borderRadius: '100px', padding: '2px 8px' }}>{visibleDaily.type}</span>
                  <span style={{ fontSize: '10px', fontWeight: '500', backgroundColor: '#F7F5F1', color: '#6B6B6E', borderRadius: '100px', padding: '2px 8px' }}>{visibleDaily.budget}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B6B6E', lineHeight: '1.55', marginBottom: '12px' }}>{visibleDaily.description}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => dismissSuggestion(dailyToSugg(visibleDaily))} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '500', border: '1.5px solid #E4E1DB', cursor: 'pointer', backgroundColor: 'transparent', color: '#ADADB3' }}>Not for us</button>
                  <button onClick={() => doneSuggestion(dailyToSugg(visibleDaily))} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '500', border: '1.5px solid #E4E1DB', cursor: 'pointer', backgroundColor: 'transparent', color: '#6B6B6E' }}>Done this ✓</button>
                  <button onClick={() => approveSuggestion(dailyToSugg(visibleDaily))} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(59,109,17,0.12)', color: '#3B6D11' }}>Add to list ＋</button>
                </div>
              </div>
            )}

            {/* Static adaptive pool cards */}
            {suggestions.map(s => (
              <div key={s.title} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(246,130,51,0.2)', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#18181A', marginBottom: '2px' }}>{s.title}</div>
                <div style={{ fontSize: '11px', color: '#F68233', marginBottom: '6px' }}>📍 {s.location}</div>
                <div style={{ fontSize: '12px', color: '#6B6B6E', lineHeight: '1.55', marginBottom: '12px' }}>{s.desc}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => dismissSuggestion(s)} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '500', border: '1.5px solid #E4E1DB', cursor: 'pointer', backgroundColor: 'transparent', color: '#ADADB3' }}>Not for us</button>
                  <button onClick={() => doneSuggestion(s)} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '500', border: '1.5px solid #E4E1DB', cursor: 'pointer', backgroundColor: 'transparent', color: '#6B6B6E' }}>Done this ✓</button>
                  <button onClick={() => approveSuggestion(s)} style={{ flex: 1, padding: '9px 6px', borderRadius: '11px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(59,109,17,0.12)', color: '#3B6D11' }}>Add to list ＋</button>
                </div>
              </div>
            ))}
            {filtered.length > 0 && <div style={{ fontSize: '11px', fontWeight: '600', color: '#ADADB3', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '4px 0 8px' }}>Your ideas</div>}
          </div>
        )}

        {filtered.length === 0 && !adding && tab !== 'pending' && (
          <div style={{ textAlign: 'center', color: '#ADADB3', fontSize: '14px', marginTop: '40px' }}>No {tab} dates yet</div>
        )}

        {filtered.map(date => (
          <div key={date.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#18181A' }}>{date.title}</div>
                {date.location && <div style={{ fontSize: '11px', color: '#ADADB3', marginTop: '3px' }}>📍 {date.location} · {date.addedBy}</div>}
              </div>
              <button onClick={() => startEdit(date)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#ADADB3', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-7 7H3V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            {date.desc && <div style={{ fontSize: '12px', color: '#6B6B6E', lineHeight: '1.55', marginTop: '8px' }}>{date.desc}</div>}
            {date.status === 'pending' && (
              <div style={{ display: 'flex', gap: '7px', marginTop: '11px' }}>
                <button onClick={() => updateStatus(date.id, 'done')} style={{ flex: 1, padding: '9px', borderRadius: '11px', fontSize: '12px', fontWeight: '500', border: '1.5px solid #E4E1DB', cursor: 'pointer', backgroundColor: 'transparent', color: '#6B6B6E' }}>Decline</button>
                <button onClick={() => updateStatus(date.id, 'approved')} style={{ flex: 1, padding: '9px', borderRadius: '11px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(59,109,17,0.12)', color: '#3B6D11' }}>✓ Approve</button>
              </div>
            )}
            {date.status === 'approved' && (
              <button onClick={() => updateStatus(date.id, 'done')} style={{ marginTop: '10px', width: '100%', padding: '9px', borderRadius: '11px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', backgroundColor: '#263322', color: '#F68233' }}>Mark as done ✓</button>
            )}
          </div>
        ))}
      </div>
      <Nav />
    </div>
  )
}
