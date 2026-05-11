import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { migrateLocalToSupabase } from '../lib/migrate'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      // Run migration in background — don't block auth
      if (u) migrateLocalToSupabase(u.id).catch(err => console.error('[auth] migration error:', err))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      // Run migration in background — don't block auth
      if (u) migrateLocalToSupabase(u.id).catch(err => console.error('[auth] migration error:', err))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, signInWithEmail, signInWithGoogle, signOut }
}
