import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
const Mark = ({ small }: { small?: boolean }) => (
  <span className={`relative grid shrink-0 place-items-center rounded-md bg-accent font-mono font-semibold text-white ${small ? 'h-6 w-6 text-[11px]' : 'h-8 w-8 text-sm'}`}>A</span>)
const FL = ({ to, children }: any) => <li><Link to={to} className="text-mute transition hover:text-ink">{children}</Link></li>
export default function Layout() {
  const { user, isAdmin, signOut } = useAuth(); const nav = useNavigate(); const { pathname } = useLocation(); const [q, setQ] = useState('')
  const contact = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com'
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><Mark />ATR'S MARKET</Link>
          <form onSubmit={e => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`) }} className="order-3 w-full sm:order-none sm:ml-6 sm:w-80">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-mute" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search software, apps, templates…" aria-label="Search" className="input pl-9" /></div>
          </form>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link to="/explore" className="rounded-md px-3 py-2 text-mute transition hover:text-ink">Explore</Link>
            <Link to="/explore?price=free" className="hidden rounded-md px-3 py-2 text-mute transition hover:text-ink sm:block">Free</Link>
            {user ? <>
              <Link to="/library" className="rounded-md px-3 py-2 text-mute transition hover:text-ink">Library</Link>
              {isAdmin && <Link to="/admin" className="rounded-md px-3 py-2 text-accent">Admin</Link>}
              <button className="btn-ghost ml-1" onClick={async () => { await signOut(); nav('/') }}>Sign out</button>
            </> : <Link to="/login" className="btn ml-1">Sign in</Link>}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><Outlet /></main>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><Link to="/" className="flex items-center gap-2.5 font-semibold"><Mark small />ATR'S MARKET</Link>
            <p className="mt-3 max-w-xs leading-relaxed text-mute">Software, apps, games, templates and digital files, delivered securely.</p></div>
          <div><h4 className="mb-3 text-[13px] text-mute">Marketplace</h4><ul className="space-y-2.5"><FL to="/explore">Explore all</FL><FL to="/explore?price=free">Free products</FL><FL to="/explore?price=paid">Paid products</FL><FL to="/explore?sort=popular">Most popular</FL></ul></div>
          <div><h4 className="mb-3 text-[13px] text-mute">Company</h4><ul className="space-y-2.5"><FL to="/about">About</FL><FL to="/contact">Contact</FL><FL to="/login">My account</FL></ul></div>
          <div><h4 className="mb-3 text-[13px] text-mute">Legal</h4><ul className="space-y-2.5"><FL to="/terms">Terms of Service</FL><FL to="/privacy">Privacy Policy</FL><FL to="/refund">Refund Policy</FL></ul></div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-mute">
            <span>© {new Date().getFullYear()} ATR'S MARKET. All rights reserved.</span>
            <a href={`mailto:${contact}`} className="hover:text-ink">{contact}</a></div></div>
      </footer>
    </div>)
}
