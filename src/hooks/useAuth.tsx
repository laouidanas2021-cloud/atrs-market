import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
const Ctx = createContext<any>(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async (u: User | null) => {
      setUser(u)
      if (u) { const { data } = await supabase.from('admin_roles').select('user_id').maybeSingle(); setAdmin(!!data) } else setAdmin(false)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null))
    const { data: s } = supabase.auth.onAuthStateChange((_e, sess) => { setTimeout(() => load(sess?.user ?? null), 0) })
    return () => s.subscription.unsubscribe()
  }, [])
  return <Ctx.Provider value={{ user, isAdmin, loading, signOut: () => supabase.auth.signOut() }}>{children}</Ctx.Provider>
}
