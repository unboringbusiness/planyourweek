import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers['authorization']
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // Get API key status using service role
  const db = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await db
    .from('api_keys')
    .select('key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return res.json({ has_key: false, connected: false })
  }

  return res.json({
    has_key: true,
    key_prefix: data.key_prefix,
    connected: !!data.last_used_at,
    last_used_at: data.last_used_at,
    created_at: data.created_at,
  })
}
