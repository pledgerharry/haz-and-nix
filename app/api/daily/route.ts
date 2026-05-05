import Anthropic from '@anthropic-ai/sdk'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()

function adminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'Spring'
  if (month >= 6 && month <= 8) return 'Summer'
  if (month >= 9 && month <= 11) return 'Autumn'
  return 'Winter'
}

function getDaysTogether(date: Date): number {
  const start = new Date('2025-09-04')
  return Math.max(0, Math.round((date.getTime() - start.getTime()) / 86400000))
}

async function getRecentSuggestionTitles(db: FirebaseFirestore.Firestore, today: Date): Promise<string[]> {
  const titles: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    try {
      const snap = await db.collection('dateSuggestions').doc(dateStr).get()
      if (snap.exists) {
        const data = snap.data()
        if (data?.title) titles.push(data.title)
      }
    } catch { /* skip */ }
  }
  return titles
}

const SYSTEM = `You generate daily personalised content for Harry and Nicole (Haz & Nix), a couple together since 4 September 2025, long-distance between Cambridge (Harry) and Croydon/South London (Nicole). They love live music and gigs, exploring on days out, being silly and playful together, and being kind to people. They enjoy doing fake job interviews together for fun, swapping facts and trivia, playing word games, and discovering weird and wonderful things about the world.

For the dateSuggestion field, you are generating one specific, actionable date idea for them. Think like a friend who knows them well — not a travel blog.

THEIR INTERESTS: Music (gigs, record shopping, listening sessions), food and trying new cuisines, markets, vintage and thrifting, getting out in nature, art and making things (pottery, ceramics, painting), film and TV, spontaneous and unusual experiences.

DATE TYPES THEY ENJOY: Food & drink, outdoor and active, cultural (museums, galleries, gigs, cinema), cosy and low-key (pubs, board games, staying in), day trips, spontaneous/unusual ideas.

LOCATIONS: Suggestions should be in Cambridge, Croydon/South London, or a day trip reachable from either. Occasionally somewhere further afield if genuinely worth it. Do NOT always default to Cambridge — vary across their two cities and London.

BUDGET: Vary the budget. Some ideas should be free or cheap, some mid-range (£30–£80), occasionally something special.

SEASONAL AWARENESS: Lean into the current season — outdoor ideas in summer, cosy/indoor ideas in winter, mix in spring and autumn.

TONE: Warm and thoughtful, but also fun and a bit playful. Be specific and practical. Never generic.

Return ONLY valid JSON (no markdown, no explanation) matching this exact shape:
{
  "question": "A thoughtful, fun question of the day",
  "questionFact": "A short fun fact related to the question, starting with an emoji",
  "wyr": {
    "question": "Would you rather...",
    "optionA": "First option with relevant emoji",
    "optionB": "Second option with relevant emoji"
  },
  "interview": {
    "role": "A silly job title",
    "company": "A ridiculous company name",
    "description": "A funny job description in 2 sentences",
    "questions": ["q1", "q2", "q3", "q4", "q5"]
  },
  "dateSuggestion": {
    "title": "Short punchy name for the date idea",
    "description": "2-3 sentences. What it is, why they'd love it, any specific detail that makes it feel personal to them.",
    "location": "Specific place or city",
    "budget": "Free | Under £15 | £30-£80 | Splash out",
    "type": "Food & drink | Outdoor | Cultural | Cosy | Day trip | Remote"
  }
}

Make everything warm, playful, and personalised. Vary the themes across days. Keep interview questions fun and in-character.`

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const season = getSeason(now.getMonth() + 1)
  const daysTogether = getDaysTogether(now)

  const db = adminDb()
  const recentTitles = await getRecentSuggestionTitles(db, now)
  const recentStr = recentTitles.length > 0
    ? recentTitles.map(t => `"${t}"`).join(', ')
    : 'none yet'

  const userMessage = `Today's date: ${date}
Current season: ${season}
Days together since first date (4 September 2025): ${daysTogether}
Recent date suggestions to avoid repeating: ${recentStr}

Generate the daily content.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  let content: {
    question: string
    questionFact: string
    wyr: { question: string; optionA: string; optionB: string }
    interview: { role: string; company: string; description: string; questions: string[] }
    dateSuggestion: { title: string; description: string; location: string; budget: string; type: string }
  }
  try {
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    content = JSON.parse(jsonStr)
  } catch {
    return Response.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }

  const batch = db.batch()

  batch.set(db.collection('daily').doc(date), {
    ...content,
    date,
    generatedAt: FieldValue.serverTimestamp(),
  })

  batch.set(db.collection('questions').doc(date), {
    question: content.question,
    fact: content.questionFact,
    date,
  }, { merge: true })

  batch.set(db.collection('wyr').doc(date), {
    question: content.wyr.question,
    optionA: content.wyr.optionA,
    optionB: content.wyr.optionB,
    date,
  }, { merge: true })

  batch.set(db.collection('interview').doc(date), {
    role: content.interview.role,
    company: content.interview.company,
    description: content.interview.description,
    questions: content.interview.questions,
    date,
  }, { merge: true })

  batch.set(db.collection('dateSuggestions').doc(date), {
    ...content.dateSuggestion,
    date,
    generatedAt: FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return Response.json({ success: true, date, content })
}
