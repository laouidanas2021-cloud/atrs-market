import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Compass, LayoutGrid, LibraryBig, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const Mark = () => <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent font-mono text-[13px] font-semibold tracking-tight text-white">ATR</span>

function Avatar({ label }: { label: string }) {
  const initial = (label || '?').trim().charAt(0).toUpperCase()
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-panel2 text-xs font-medium text-ink">{initial}</span>
}

function NavLinks({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const items = [
    { to: '/', label: 'Home', icon: LayoutGrid, exact: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/library', label: 'Library', icon: LibraryBig },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]
  return (
    <nav className="space-y-0.5">
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to)
        return (
          <Link key={to} to={to} onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${active ? 'bg-panel2 text-ink' : 'text-mute hover:bg-panel2/60 hover:text-ink'}`}>
            <Icon className="h-4 w-4" />{label}
          </Link>)
      })}
    </nav>)
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin, signOut } = useAuth(); const nav = useNavigate(); const [q, setQ] = useState('')
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 font-semibold tracking-tight"><Mark />ATR'S MARKET</Link>
      <form onSubmit={e => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); onNavigate?.() }}>
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-mute" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search" className="input pl-9" /></div>
      </form>
      <NavLinks isAdmin={isAdmin} onNavigate={onNavigate} />
      <div className="mt-auto border-t border-line pt-4">
        {user ? (
          <div className="flex items-center gap-2.5">
            <Avatar label={user.email || 'U'} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm">{user.email}</p><p className="text-xs text-mute">{isAdmin ? 'Administrator' : 'Account'}</p></div>
            <button aria-label="Sign out" title="Sign out" className="rounded-md p-2 text-mute transition hover:bg-panel2 hover:text-ink" onClick={async () => { await signOut(); onNavigate?.(); nav('/') }}>
              <LogOut className="h-4 w-4" /></button>
          </div>
        ) : <Link to="/login" onClick={onNavigate} className="btn w-full">Sign in</Link>}
      </div>
    </div>)
}

export default function Layout() {
  const { pathname } = useLocation(); const [open, setOpen] = useState(false)
  useEffect(() => { window.scrollTo(0, 0); setOpen(false) }, [pathname])
  const contact = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com'
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-panel md:block">
        <div className="sticky top-0 h-screen"><SidebarBody /></div>
      </aside>
      <header className="flex items-center justify-between border-b border-line bg-panel px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><Mark />ATR'S MARKET</Link>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-2 text-mute hover:bg-panel2 hover:text-ink"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-panel">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-md p-2 text-mute hover:bg-panel2 hover:text-ink"><X className="h-5 w-5" /></button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </div>)}
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-line px-4 py-6 text-xs text-mute md:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} ATR'S MARKET. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms" className="hover:text-ink">Terms</Link>
              <Link to="/privacy" className="hover:text-ink">Privacy</Link>
              <Link to="/refund" className="hover:text-ink">Refund</Link>
              <a href={`mailto:${contact}`} className="hover:text-ink">{contact}</a>
            </div>
          </div>
        </footer>
      </div>
    </div>)
}
