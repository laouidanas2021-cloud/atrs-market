import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
export default function Auth() {
  const nav = useNavigate(); const loc: any = useLocation(); const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setE] = useState(''), [pw, setPw] = useState(''), [name, setName] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e: any) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    try {
      if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password: pw }); if (error) throw error; nav(loc.state?.from || '/library') }
      else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name }, emailRedirectTo: location.origin } }); if (error) throw error
        if (data.session) nav(loc.state?.from || '/library'); else setMsg('Check your email to confirm your account.') }
      else { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset` }); if (error) throw error; setMsg('If that email exists, a reset link is on its way.') }
    } catch (x: any) { setErr(x.message) } finally { setBusy(false) } }
  return (
    <form onSubmit={submit} className="card mx-auto mt-8 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password'}</h1>
      {mode === 'register' && <div><label className="label" htmlFor="n">Name</label><input id="n" className="input" required value={name} onChange={e => setName(e.target.value)} /></div>}
      <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" className="input" required value={email} onChange={e => setE(e.target.value)} /></div>
      {mode !== 'forgot' && <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" minLength={8} className="input" required value={pw} onChange={e => setPw(e.target.value)} /></div>}
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}{msg && <p className="text-sm text-emerald-400">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}</button>
      <div className="flex justify-between text-xs text-mute">
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Back to sign in'}</button>
        {mode === 'login' && <button type="button" onClick={() => setMode('forgot')}>Forgot password?</button>}</div>
    </form>)
}
export function Reset() {
  const nav = useNavigate(); const [pw, setPw] = useState(''), [err, setErr] = useState('')
  return (
    <form onSubmit={async e => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password: pw }); error ? setErr(error.message) : nav('/library') }} className="card mx-auto mt-8 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <input type="password" minLength={8} required className="input" aria-label="New password" value={pw} onChange={e => setPw(e.target.value)} />
      {err && <p className="text-sm text-red-400">{err}</p>}<button className="btn w-full">Update password</button></form>)
}
