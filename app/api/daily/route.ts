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

const SYSTEM = `You generate daily personalised content for Harry and Nicole, a couple together since 4 September 2025, long-distance between Cambridge (Harry) and Croydon (Nicole). They love live music and gigs, exploring on days out, being silly and playful together, and being kind to people.

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
    "emoji": "📍",
    "title": "Date idea title",
    "description": "What you'd do on this date in 1-2 sentences",
    "location": "Cambridge / Croydon / London / somewhere between"
  }
}

Make everything warm, playful, and personalised. Vary the themes across days: music, food, travel, creativity, kindness, silliness. Keep interview questions fun and in-character for the silly role.`

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const date = new Date().toISOString().split('T')[0]

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Today's date: ${date}. Generate the daily content.` }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  let content: {
    question: string
    questionFact: string
    wyr: { question: string; optionA: string; optionB: string }
    interview: { role: string; company: string; description: string; questions: string[] }
    dateSuggestion: { emoji: string; title: string; description: string; location: string }
  }
  try {
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    content = JSON.parse(jsonStr)
  } catch {
    return Response.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }

  const db = adminDb()
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

  await batch.commit()

  return Response.json({ success: true, date, content })
}
