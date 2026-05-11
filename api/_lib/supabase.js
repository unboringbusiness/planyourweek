import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Authenticate via API key (header or query param), return user_id or null
export async function authenticateRequest(req) {
  // Try Authorization header first, then ?key= query param
  const auth = req.headers['authorization']
  let key = auth?.replace('Bearer ', '')
  if (!key || !key.startsWith('pyw_')) {
    key = req.query?.key
  }
  if (!key || !key.startsWith('pyw_')) return null

  const keyHash = crypto.createHash('sha256').update(key).digest('hex')
  const db = getSupabase()

  const { data, error } = await db
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) return null

  // Update last_used_at
  db.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash).then(() => {})

  return data.user_id
}
