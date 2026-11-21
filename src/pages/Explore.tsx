import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Grid } from '../components/ProductCard'
const PER = 12
export default function Explore() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', cat = sp.get('cat') || '', price = sp.get('price') || '', sort = sp.get('sort') || 'new', page = Number(sp.get('page') || 1)
  const [items, setItems] = useState<any[]>([]); const [count, setCount] = useState(0); const [cats, setCats] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const upd = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n) }
  useEffect(() => { supabase.from('categories').select('*').order('name').then(r => setCats(r.data || [])) }, [])
  useEffect(() => { (async () => {
    setLoading(true)
    let qb = supabase.from('products').select('*', { count: 'exact' }).eq('is_published', true)
    const s = q.replace(/[,()%*]/g, ' ').trim()
    if (s) qb = qb.or(`name.ilike.%${s}%,description.ilike.%${s}%`)
    if (cat) qb = qb.eq('category_id', cat)
    if (price) qb = qb.eq('pricing', price)
    qb = sort === 'popular' ? qb.order('download_count', { ascending: false }) : sort === 'price_asc' ? qb.order('price_cents') : sort === 'price_desc' ? qb.order('price_cents', { ascending: false }) : qb.order('created_at', { ascending: false })
    const { data, count } = await qb.range((page - 1) * PER, page * PER - 1)
    setItems(data || []); setCount(count || 0); setLoading(false) })() }, [q, cat, price, sort, page])
  const pages = Math.max(1, Math.ceil(count / PER))
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{q ? `Results for “${q}”` : 'Explore products'}</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <select className="input" aria-label="Category" value={cat} onChange={e => upd('cat', e.target.value)}><option value="">All categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="input" aria-label="Price" value={price} onChange={e => upd('price', e.target.value)}><option value="">Free & paid</option><option value="free">Free</option><option value="paid">Paid</option></select>
        <select className="input" aria-label="Sort" value={sort} onChange={e => upd('sort', e.target.value)}><option value="new">Newest</option><option value="popular">Most popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
        <input className="input" placeholder="Search" aria-label="Search" defaultValue={q} onKeyDown={e => e.key === 'Enter' && upd('q', (e.target as HTMLInputElement).value)} />
      </div>
      <Grid items={items} loading={loading} />
      {pages > 1 && <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button className="btn-ghost" disabled={page <= 1} onClick={() => upd('page', String(page - 1))}>Previous</button>
        <span className="text-mute">Page {page} of {pages}</span>
        <button className="btn-ghost" disabled={page >= pages} onClick={() => upd('page', String(page + 1))}>Next</button></div>}
    </div>)
}
