import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function authenticate(req) {
  const auth = req.headers['authorization']
  const key = auth?.replace('Bearer ', '')
  if (!key || key !== process.env.PYW_API_KEY) {
    return false
  }
  return true
}

// Default user — single-user API for now
export const USER_ID = 'ffafdf2d-44bf-4388-a7c3-ee284c4848a1'
