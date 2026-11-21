import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, FileArchive } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Grid } from '../components/ProductCard'
export default function Home() {
  const nav = useNavigate(); const [q, setQ] = useState('')
  const [featured, setF] = useState<any[]>([]); const [latest, setL] = useState<any[]>([]); const [cats, setC] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => {
    const [f, l, c] = await Promise.all([
      supabase.from('products').select('*').eq('is_published', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('categories').select('*, products(count)').order('name')])
    setF(f.data || []); setL(l.data || []); setC(c.data || []); setLoading(false) })() }, [])
  const Head = ({ t, to }: any) => <div className="mb-5 flex items-end justify-between"><h2 className="text-lg font-medium">{t}</h2>{to && <Link to={to} className="text-sm text-accent hover:underline">View all</Link>}</div>
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pb-4 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-[1.1] sm:text-5xl">Software and digital assets, ready to download.</h1>
          <p className="mt-5 max-w-sm leading-relaxed text-mute">Apps, utilities, games, templates and documents. Free products download instantly; paid products unlock the moment your payment is confirmed.</p>
          <form onSubmit={e => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`) }} className="mt-8 flex max-w-md gap-2">
            <div className="relative flex-1"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-mute" /><input className="input h-11 pl-10" placeholder="What are you looking for?" aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} /></div>
            <button className="btn h-11 px-5">Search</button></form>
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-xs text-mute"><span className="h-2 w-2 rounded-full bg-ok/70" />Download ready</div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3 rounded-md border border-line bg-bg p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent/15 text-accent"><FileArchive className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">project-template.zip</p><p className="mono-data text-xs text-mute">v2.4.0 · 84.2 MB</p></div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full w-[72%] rounded-full bg-accent" /></div>
            <p className="mono-data text-xs text-mute">72% · 61.0 of 84.2 MB</p>
            <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-mute"><span>Purchased · licensed to your account</span><span className="text-ok">Verified</span></div>
          </div>
        </div>
      </section>
      {cats.length > 0 && <section><Head t="Browse by category" />
        <div className="flex flex-wrap gap-2">{cats.map((c: any) => (
          <Link key={c.id} to={`/explore?cat=${c.id}`} className="flex items-center gap-2 rounded-md border border-line bg-panel px-3.5 py-2 text-sm transition hover:border-mute/40">
            {c.name}<span className="mono-data text-xs text-mute">{c.products?.[0]?.count ?? 0}</span></Link>))}</div></section>}
      {featured.length > 0 && <section><Head t="Featured" /><Grid items={featured} /></section>}
      <section><Head t="Latest products" to="/explore" /><Grid items={latest} loading={loading} /></section>
      <section className="border-t border-line pt-10">
        <h2 className="mb-6 text-lg font-medium">How it works</h2>
        <ol className="space-y-0 border-l border-line pl-6">
          {[['Find a product', 'Search or browse categories, and read the full details, screenshots and changelog before you decide.'],
            ['Get it', 'Download free products right away, or check out securely for paid ones — your card details never touch our servers.'],
            ['Keep it', 'Everything you get stays in your personal library, ready to download again whenever you need it.']].map(([t, d], i) => (
            <li key={t} className="relative pb-8 last:pb-0">
              <span className="mono-data absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full border border-line bg-bg text-xs text-mute">{i + 1}</span>
              <h3 className="font-medium">{t}</h3><p className="mt-1 max-w-md text-sm leading-relaxed text-mute">{d}</p>
            </li>))}
        </ol>
      </section>
      <section className="flex flex-col items-start gap-4 border-t border-line pt-10">
        <h2 className="text-lg font-medium">Start exploring today</h2>
        <p className="max-w-md text-sm leading-relaxed text-mute">Create a free account to keep your purchases and downloads in one place.</p>
        <div className="flex gap-3"><Link to="/explore" className="btn">Browse products</Link><Link to="/login" className="btn-ghost">Create account</Link></div>
      </section>
    </div>)
}
