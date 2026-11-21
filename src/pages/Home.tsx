import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Gamepad2, LayoutTemplate, Lock, Package, Search, ShieldCheck, Smartphone, Wrench, Zap, Download, CreditCard, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Grid } from '../components/ProductCard'
const ICONS: any = { software: Package, apps: Smartphone, utilities: Wrench, games: Gamepad2, templates: LayoutTemplate, documents: FileText }
export default function Home() {
  const nav = useNavigate(); const [q, setQ] = useState('')
  const [featured, setF] = useState<any[]>([]); const [latest, setL] = useState<any[]>([]); const [cats, setC] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => {
    const [f, l, c] = await Promise.all([
      supabase.from('products').select('*').eq('is_published', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('categories').select('*').order('name')])
    setF(f.data || []); setL(l.data || []); setC(c.data || []); setLoading(false) })() }, [])
  const Head = ({ t, to }: any) => <div className="mb-5 flex items-end justify-between"><h2 className="text-xl font-semibold tracking-tight">{t}</h2>{to && <Link to={to} className="text-sm text-accent hover:underline">View all →</Link>}</div>
  return (
    <div className="space-y-20">
      <section className="hero-glow -mx-4 rounded-3xl px-4 pb-6 pt-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-mute"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Digital products marketplace</span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Software and digital assets, <span className="text-accent">ready to download.</span></h1>
        <p className="mx-auto mt-5 max-w-xl text-mute">Apps, utilities, games, templates and documents. Free products download instantly; paid products unlock the moment your payment is confirmed.</p>
        <form onSubmit={e => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`) }} className="mx-auto mt-9 flex max-w-xl gap-2">
          <div className="relative flex-1"><Search className="absolute left-4 top-3.5 h-4 w-4 text-mute" /><input className="input h-12 pl-11 text-base" placeholder="What are you looking for?" aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} /></div>
          <button className="btn h-12 px-6">Search</button></form>
        <div className="mt-10 grid gap-3 text-sm text-mute sm:grid-cols-3 sm:gap-6 mx-auto max-w-3xl">
          {[[ShieldCheck, 'Secure payments'], [Zap, 'Instant downloads'], [Lock, 'Protected files']].map(([I, t]: any) => <div key={t} className="flex items-center justify-center gap-2"><I className="h-4 w-4 text-accent" />{t}</div>)}</div>
      </section>
      {cats.length > 0 && <section><Head t="Browse by category" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{cats.map(c => { const I = ICONS[c.slug] || Tag; return (
          <Link key={c.id} to={`/explore?cat=${c.id}`} className="card group flex flex-col items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-accent/60">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent transition group-hover:bg-accent group-hover:text-white"><I className="h-5 w-5" /></span><span className="text-sm font-medium">{c.name}</span></Link>) })}</div></section>}
      {featured.length > 0 && <section><Head t="Featured" /><Grid items={featured} /></section>}
      <section><Head t="Latest products" to="/explore" /><Grid items={latest} loading={loading} /></section>
      <section><Head t="How it works" />
        <div className="grid gap-4 sm:grid-cols-3">{[[Search, 'Find a product', 'Search or browse categories and read the full details, screenshots and changelog.'],
          [CreditCard, 'Get it', 'Download free products right away, or check out securely for paid ones.'],
          [Download, 'Download anytime', 'Everything you get stays in your personal library, ready to download again.']].map(([I, t, d]: any, i) =>
          <div key={t} className="card p-6"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent"><I className="h-4 w-4" /></span><span className="text-xs text-mute">Step {i + 1}</span></div><h3 className="font-medium">{t}</h3><p className="mt-1 text-sm text-mute">{d}</p></div>)}</div></section>
      <section className="card flex flex-col items-center gap-4 p-10 text-center"><h2 className="text-2xl font-semibold tracking-tight">Start exploring today</h2><p className="max-w-md text-sm text-mute">Create a free account to keep your purchases and downloads in one place.</p>
        <div className="flex gap-3"><Link to="/explore" className="btn">Browse products</Link><Link to="/login" className="btn-ghost">Create account</Link></div></section>
    </div>)
}
