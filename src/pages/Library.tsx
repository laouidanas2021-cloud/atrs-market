import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { download, money, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Library() {
  const { user } = useAuth(); const [sp] = useSearchParams(); const [buys, setB] = useState<any[]>([]); const [logs, setL] = useState<any[]>([]); const [prof, setProf] = useState<any>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => {
    const [b, l, p] = await Promise.all([
      supabase.from('purchases').select('*,products(id,name,slug,version)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('download_logs').select('created_at,products(name,slug)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()])
    setB(b.data || []); setL(l.data || []); setProf(p.data); setLoading(false) })() }, [user])
  if (loading) return <p className="py-20 text-center text-mute">Loading…</p>
  const owned = buys.filter(b => b.status === 'paid')
  const saveName = async () => { const n = prompt('Your name', prof?.full_name || ''); if (n === null) return; await supabase.from('profiles').update({ full_name: n }).eq('id', user.id); setProf({ ...prof, full_name: n }) }
  return (
    <div className="space-y-10">
      {sp.get('checkout') === 'success' && <p className="card p-3 text-sm text-emerald-400">Thanks! Your payment is being confirmed. If the product is not below yet, refresh in a minute.</p>}
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">My library</h1><p className="text-sm text-mute">{prof?.full_name || 'No name set'} · {user.email}</p></div><button className="btn-ghost" onClick={saveName}>Edit name</button></div>
      <section><h2 className="mb-3 font-medium">Purchased products</h2>
        {!owned.length ? <p className="text-sm text-mute">Nothing here yet. <Link className="text-accent" to="/explore">Browse products</Link></p> :
          <div className="grid gap-3 sm:grid-cols-2">{owned.map(b => <div key={b.id} className="card flex items-center justify-between p-4">
            <div><Link to={`/product/${b.products.slug}`} className="font-medium">{b.products.name}</Link><p className="text-xs text-mute">v{b.products.version}</p></div>
            <button className="btn" onClick={() => download(b.products.id)}><Download className="h-4 w-4" />Download</button></div>)}</div>}</section>
      <section><h2 className="mb-3 font-medium">Purchase history</h2>
        {!buys.length ? <p className="text-sm text-mute">No orders.</p> : <div className="card divide-y divide-line text-sm">{buys.map(b => <div key={b.id} className="flex justify-between p-3"><span>{b.products?.name}</span><span className="text-mute">{money(b.amount_cents, b.currency)} · {b.status} · {new Date(b.created_at).toLocaleDateString()}</span></div>)}</div>}</section>
      <section><h2 className="mb-3 font-medium">Download history</h2>
        {!logs.length ? <p className="text-sm text-mute">No downloads yet.</p> : <div className="card divide-y divide-line text-sm">{logs.map((l, i) => <div key={i} className="flex justify-between p-3"><span>{l.products?.name}</span><span className="text-mute">{new Date(l.created_at).toLocaleString()}</span></div>)}</div>}</section>
    </div>)
}
