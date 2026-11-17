/**
 * POST /api/contact — stores a contact form submission.
 *
 * The browser never writes to the contact_submissions table directly; this
 * function validates the payload, applies spam protection and inserts with the
 * service-role key, which only exists on the server.
 *
 * Spam protection: honeypot field, minimum fill time, strict validation,
 * link-count limit, and per-IP + global hourly rate limits.
 */
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const PER_IP_PER_HOUR = 3
const GLOBAL_PER_HOUR = 40
const INQUIRY_TYPES = ['Freelance work', 'Software development', 'Product collaboration', 'Technical discussion', 'Other']

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'not_configured' }, 503)

  let body: Record<string, unknown>
  try {
    const text = await request.text()
    if (text.length > 20_000) return json({ error: 'Message is too long.' }, 413)
    body = JSON.parse(text)
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // Bots fill the hidden field and submit instantly. Pretend it worked.
  if (body.website || Number(body.elapsed_ms) < 2500) return json({ ok: true })

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const message = String(body.message ?? '').trim()
  const inquiry = INQUIRY_TYPES.includes(String(body.inquiry_type)) ? String(body.inquiry_type) : 'Other'

  if (name.length < 2 || name.length > 100) return json({ error: 'Please enter your name.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200)
    return json({ error: 'Please enter a valid email address.' }, 400)
  if (message.length < 10 || message.length > 5000)
    return json({ error: 'Your message should be between 10 and 5000 characters.' }, 400)
  if ((message.match(/https?:\/\//gi) ?? []).length > 3)
    return json({ error: 'Please remove some of the links from your message.' }, 400)

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const ip_hash = createHash('sha256')
    .update(ip + (process.env.CONTACT_IP_SALT ?? 'ragbooms'))
    .digest('hex')

  const db = createClient(url, key, { auth: { persistSession: false } })
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const [mine, all] = await Promise.all([
    db.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', since),
    db.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ])
  if (mine.error || all.error) return json({ error: 'Could not send your message. Please try again later.' }, 500)
  if ((mine.count ?? 0) >= PER_IP_PER_HOUR || (all.count ?? 0) >= GLOBAL_PER_HOUR)
    return json({ error: 'Too many messages right now. Please try again in a while.' }, 429)

  const { error } = await db.from('contact_submissions').insert({
    name,
    email,
    inquiry_type: inquiry,
    message,
    ip_hash,
    user_agent: (request.headers.get('user-agent') ?? '').slice(0, 300),
  })
  if (error) return json({ error: 'Could not send your message. Please try again later.' }, 500)

  // Optional email notification. Failure here never fails the submission.
  if (process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_TO) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_NOTIFY_FROM || 'RAGBOOMS <onboarding@resend.dev>',
        to: process.env.CONTACT_NOTIFY_TO,
        reply_to: email,
        subject: `[RAGBOOMS] ${inquiry} — ${name}`,
        text: `${name} <${email}>\n${inquiry}\n\n${message}`,
      }),
    }).catch(() => undefined)
  }

  return json({ ok: true })
}
