import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // User must be authenticated via Supabase session token
  const authHeader = req.headers['authorization']
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // Generate API key
  const rawKey = `pyw_${crypto.randomBytes(24).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12)

  // Store hash in DB (using service role to bypass RLS for insert)
  const db = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete existing keys for this user (one key per user for simplicity)
  await db.from('api_keys').delete().eq('user_id', user.id)

  const { error: insertError } = await db.from('api_keys').insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: req.body?.name || 'default',
  })

  if (insertError) return res.status(500).json({ error: insertError.message })

  // Return the raw key — only time it's ever shown
  return res.json({ api_key: rawKey, prefix: keyPrefix })
}
