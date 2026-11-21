import { Link } from 'react-router-dom'
import { img, money } from '../lib/supabase'
export default function ProductCard({ p }: { p: any }) {
  return (
    <Link to={`/product/${p.slug}`} className="group relative block overflow-hidden rounded-lg border border-line bg-panel transition hover:border-mute/40">
      <span className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-accent transition-transform group-hover:scale-y-100" />
      <div className="aspect-[16/10] border-b border-line bg-bg">
        {p.logo_url ? <img src={img(p.logo_url)} alt={p.name} loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" /> : <div className="grid h-full place-items-center text-xs text-mute">No preview</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug">{p.name}</h3>
          <span className={`mono-data shrink-0 text-sm ${p.pricing === 'free' ? 'text-ok' : 'text-ink'}`}>{p.pricing === 'free' ? 'Free' : money(p.price_cents, p.currency)}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-mute">{p.description}</p>
      </div>
    </Link>)
}
export function Grid({ items, loading }: { items: any[]; loading?: boolean }) {
  if (loading) return <p className="py-16 text-center text-sm text-mute">Loading products…</p>
  if (!items.length) return <div className="rounded-lg border border-dashed border-line py-16 text-center text-sm text-mute">No products match these filters.</div>
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
}
