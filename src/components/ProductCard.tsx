import { Link } from 'react-router-dom'
import { img, money } from '../lib/supabase'
export default function ProductCard({ p }: { p: any }) {
  return (
    <Link to={`/product/${p.slug}`} className="card group overflow-hidden transition hover:border-accent/60">
      <div className="aspect-[16/10] bg-bg">
        {p.logo_url ? <img src={img(p.logo_url)} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-mute">No image</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{p.name}</h3>
          <span className={`text-sm font-medium ${p.pricing === 'free' ? 'text-emerald-400' : 'text-accent'}`}>{p.pricing === 'free' ? 'Free' : money(p.price_cents, p.currency)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-mute">{p.description}</p>
      </div>
    </Link>)
}
export function Grid({ items, loading }: { items: any[]; loading?: boolean }) {
  if (loading) return <p className="py-12 text-center text-sm text-mute">Loading…</p>
  if (!items.length) return <p className="py-12 text-center text-sm text-mute">No products found.</p>
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
}
