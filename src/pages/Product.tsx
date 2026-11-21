import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, ShoppingCart } from 'lucide-react'
import { checkout, download, img, money, size, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Reviews from '../components/Reviews'
export default function Product() {
  const { slug } = useParams(); const { user } = useAuth(); const nav = useNavigate()
  const [p, setP] = useState<any>(null), [owned, setOwned] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [sel, setSel] = useState(0)
  useEffect(() => { (async () => {
    const { data } = await supabase.from('products').select('*,categories(name),product_images(path,sort_order)').eq('slug', slug).maybeSingle()
    setP(data); setLoading(false)
    if (data && user) { const { data: o } = await supabase.from('purchases').select('id').eq('product_id', data.id).eq('user_id', user.id).eq('status', 'paid').limit(1); setOwned(!!o?.length) } })() }, [slug, user])
  if (loading) return <p className="py-20 text-center text-mute">Loading…</p>
  if (!p) return <p className="py-20 text-center text-mute">Product not found.</p>
  const shots = [...(p.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const free = p.pricing === 'free'
  const act = async () => { setBusy(true); try {
    if (free || owned) await download(p.id)
    else if (!user) nav('/login', { state: { from: `/product/${slug}` } })
    else await checkout(p.id) } finally { setBusy(false) } }
  const rows: [string, string][] = [['Category', p.categories?.name || '—'], ['Version', p.version], ['File size', size(p.file_size_bytes)], ['Released', p.release_date || '—']]
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card overflow-hidden"><div className="aspect-video bg-bg">
          {(shots[sel]?.path || p.logo_url) && <img src={img(shots[sel]?.path || p.logo_url)} alt={p.name} className="h-full w-full object-contain" />}</div></div>
        {shots.length > 1 && <div className="flex gap-2 overflow-x-auto">{shots.map((s: any, i: number) =>
          <button key={s.path} onClick={() => setSel(i)} aria-label={`Screenshot ${i + 1}`} className={`h-16 w-28 shrink-0 overflow-hidden rounded-lg border ${i === sel ? 'border-accent' : 'border-line'}`}><img src={img(s.path)} className="h-full w-full object-cover" alt="" /></button>)}</div>}
        <section><h2 className="mb-2 text-lg font-medium">Description</h2><p className="whitespace-pre-line text-mute">{p.description}</p></section>
        {p.system_requirements && <section><h2 className="mb-2 text-lg font-medium">System requirements</h2><p className="whitespace-pre-line text-mute">{p.system_requirements}</p></section>}
        {p.changelog && <section><h2 className="mb-2 text-lg font-medium">Changelog</h2><p className="whitespace-pre-line text-mute">{p.changelog}</p></section>}
        <Reviews productId={p.id} canReview={free || owned} />
      </div>
      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h1 className="text-2xl font-semibold">{p.name}</h1>
        <div className="text-2xl font-semibold text-accent">{free ? 'Free' : money(p.price_cents, p.currency)}</div>
        <button className="btn w-full" onClick={act} disabled={busy}>
          {free || owned ? <><Download className="h-4 w-4" />{busy ? 'Preparing…' : 'Download'}</> : <><ShoppingCart className="h-4 w-4" />{busy ? 'Redirecting…' : user ? 'Buy now' : 'Sign in to buy'}</>}</button>
        {owned && <p className="text-xs text-emerald-400">You own this product.</p>}
        <dl className="divide-y divide-line text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="text-mute">{k}</dt><dd className="mono-data">{v}</dd></div>)}</dl>
      </aside>
    </div>)
}
