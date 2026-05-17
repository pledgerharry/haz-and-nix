import Anthropic from '@anthropic-ai/sdk'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let key = raw.replace(/^["']|["']$/g, '').trim()
  key = key.replace(/\\n/g, '\n')
  if (!key.includes('\n')) {
    key = `-----BEGIN RSA PRIVATE KEY-----\n${key}\n-----END RSA PRIVATE KEY-----\n`
  }
  return key
}

function adminDb() {
  if (!getApps().length) {
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY env var is not set')
    if (!process.env.FIREBASE_PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID env var is not set')
    if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error('FIREBASE_CLIENT_EMAIL env var is not set')
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
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

async function getRecentQuestions(db: FirebaseFirestore.Firestore, today: Date): Promise<string[]> {
  const questions: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    try {
      const snap = await db.collection('daily').doc(dateStr).get()
      if (snap.exists) {
        const data = snap.data()
        if (data?.question) questions.push(data.question)
      }
    } catch { /* skip */ }
  }
  return questions
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

const SYSTEM = `You generate daily personalised content for Harry and Nicole — a couple who call themselves Haz & Nix.

WHO THEY ARE:
- Harry lives in Cambridge, Nicole lives in Croydon (South London). Long-distance couple.
- Together since 4 September 2025.
- Harry is bald with a red beard. Nicole is the self-appointed Chief Yapper.
- They are playful and sarcastic with each other in an affectionate way — banter, not meanness.
- They love music, days out, being silly, and being genuinely kind to people.
- They enjoy fake job interviews as an inside joke.
- They love fun facts and trivia.
- They've been on days out to Ely, Norwich, and St Ives together.
- They enjoy word games.

DAILY QUESTION:
Generate one question per day. Mix between:
- Silly and playful (about 60% of the time): "If I came with a warning label, what would it say?", "What's my most toxic trait when I'm hungry?", "If you could ban me from doing one thing, what would it be?", "What's something I think I'm good at but I'm actually terrible at?", "What would my villain origin story be?", "If you had to describe me using only a food, what would it be and why?", "If our relationship was a TV show, what genre would it be?", "What's something I'm better at than anyone you've ever met?", "If you had to give me a new name, what would it be?"
- Deeper and meaningful (about 40% of the time): "What's a moment with me you keep coming back to?", "What's something small I do that you love but never told me?", "When did you first think this might actually be something?", "What's something you want us to do before the end of this year?", "What's a quality of mine you hope never changes?"
Questions should mostly be about Harry and Nicole specifically — use "me/my" from the asker's perspective, tied to their specific dynamic. Occasionally more general. They should feel like something you'd actually ask each other on a long-distance call, not a generic couples app.
Always include a fun fact loosely related to the question topic. Start the fact with an emoji.

WOULD YOU RATHER:
Generate one per day. Both options must feel genuinely hard to choose between — no obvious answer. Vary the themes: food, music, travel, relationships, superpowers, daily life, hypotheticals. Occasionally reference their situation naturally: long distance, Cambridge, Croydon, train journeys, days out. Keep it fun but with real tension in the choice.
Examples of the right vibe: "Would you rather only ever listen to one album forever or never listen to the same song twice?", "Would you rather always arrive an hour early or always arrive ten minutes late?", "Would you rather the train to Cambridge never runs on time, or always runs on time but takes 4 hours?"

INTERVIEW MODE:
Generate one interview role per day. Mix between:
- Ridiculous made-up roles: Chief Yapper, Director of Vibes, Head of Snack Logistics, Lemonade Taster, Professional Nap Consultant, Minister for Unsolicited Opinions, Head of Chaotic Energy, VP of Asking Questions Mid-Film
- Real jobs made silly: Head Chef (but only for cereal), Senior Software Engineer (for a company that only makes one button), Professional Dog Walker (for one very specific dog)

The role must have:
- A job title
- A silly department name and employment terms (e.g. "Dept. of Unnecessary Commentary · Full time · No holidays")
- Exactly 3 interview questions that are playful but with a hint of real interview energy. Examples: "Describe a time you successfully derailed a conversation within 30 seconds.", "Where do you see yourself in five years, specifically in terms of words per minute?", "Walk us through your process for deciding something is someone else's problem.", "How do you handle feedback that you are, in fact, the problem?", "What does good snack logistics look like to you, and how do you measure success?"

DATE SUGGESTION:
One specific, actionable date idea for Harry and Nicole. Think like a friend who knows them well, not a travel blog. Ideas should be somewhere in Cambridge, South London/Croydon, or a day trip reachable from either — do NOT always default to Cambridge. Vary the budget (some free/cheap, some mid-range £30–£80, occasionally splash out). Lean into the current season. Name actual specific places. Make the description warm and personal — reference why they'd specifically love it.

Return ONLY valid JSON (no markdown, no explanation) matching this exact shape:
{
  "question": "string — the daily question",
  "fact": "string — a fun fact related to the question topic, starting with an emoji",
  "wyr": {
    "question": "string — the would you rather question",
    "optionA": "string — first option",
    "optionB": "string — second option"
  },
  "interview": {
    "role": "string — job title",
    "department": "string — silly department name and employment terms",
    "questions": ["string", "string", "string"]
  },
  "dateSuggestion": {
    "title": "string — short punchy name for the date idea",
    "description": "string — 2-3 sentences. What it is, why they'd love it, any specific detail that makes it feel personal to them.",
    "location": "string — specific place or area",
    "budget": "Free | Under £15 | £30-£80 | Splash out",
    "type": "Food & drink | Outdoor | Cultural | Cosy | Day trip | Remote"
  }
}`

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    return await handleDaily()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[daily] unhandled error:', message, stack)
    return Response.json({ error: message, stack }, { status: 500 })
  }
}

async function handleDaily() {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const season = getSeason(now.getMonth() + 1)
  const daysTogether = getDaysTogether(now)

  const db = adminDb()

  const [recentQuestions, recentTitles] = await Promise.all([
    getRecentQuestions(db, now),
    getRecentSuggestionTitles(db, now),
  ])

  const recentQStr = recentQuestions.length > 0
    ? recentQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')
    : 'none yet'

  const recentTitleStr = recentTitles.length > 0
    ? recentTitles.map(t => `"${t}"`).join(', ')
    : 'none yet'

  const userMessage = `Today's date: ${date} (${season})
Days Harry and Nicole have been together: ${daysTogether}

Questions asked in the last 7 days — do NOT repeat these or anything similar:
${recentQStr}

Recent date suggestions to avoid repeating: ${recentTitleStr}

Generate today's daily content.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  let content: {
    question: string
    fact: string
    wyr: { question: string; optionA: string; optionB: string }
    interview: { role: string; department: string; questions: string[] }
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
    fact: content.fact,
    date,
  }, { merge: true })

  batch.set(db.collection('wyr').doc(date), {
    question: content.wyr.question,
    optionA: content.wyr.optionA,
    optionB: content.wyr.optionB,
    date,
  }, { merge: true })

  // UI reads 'company' — map department to that field
  batch.set(db.collection('interview').doc(date), {
    role: content.interview.role,
    company: content.interview.department,
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
