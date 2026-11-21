import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, Compass, LayoutGrid, LibraryBig, LogOut, Menu, Moon, Search, ShieldCheck, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const MIN_W = 208, MAX_W = 360, COLLAPSED_W = 72
const Mark = () => <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent font-mono text-[13px] font-semibold tracking-tight text-white">ATR</span>
function Avatar({ label }: { label: string }) {
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-panel2 text-xs font-medium text-ink">{(label || '?').trim().charAt(0).toUpperCase()}</span>
}

function NavLinks({ isAdmin, collapsed, onNavigate }: { isAdmin: boolean; collapsed: boolean; onNavigate?: () => void }) {
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
          <Link key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${collapsed ? 'justify-center' : ''} ${active ? 'bg-panel2 text-ink' : 'text-mute hover:bg-panel2/60 hover:text-ink'}`}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && label}
          </Link>)
      })}
    </nav>)
}

function SidebarBody({ collapsed, onToggleCollapse, onNavigate }: { collapsed: boolean; onToggleCollapse: () => void; onNavigate?: () => void }) {
  const { user, isAdmin, signOut } = useAuth(); const { theme, toggle } = useTheme(); const nav = useNavigate(); const [q, setQ] = useState('')
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight"><Mark />{!collapsed && <span className="truncate">ATR'S MARKET</span>}</Link>
        <button onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label="Toggle sidebar width" className="hidden shrink-0 rounded-md p-1.5 text-mute transition hover:bg-panel2 hover:text-ink md:block">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}</button>
      </div>
      {!collapsed && <form onSubmit={e => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); onNavigate?.() }}>
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-mute" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" aria-label="Search" className="input pl-9" /></div>
      </form>}
      <NavLinks isAdmin={isAdmin} collapsed={collapsed} onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 border-t border-line pt-4">
        <button onClick={toggle} title="Toggle light / dark theme"
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-mute transition hover:bg-panel2 hover:text-ink ${collapsed ? 'justify-center' : ''}`}>
          {theme === 'dark' ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}{!collapsed && (theme === 'dark' ? 'Dark theme' : 'Light theme')}
        </button>
        {user ? (
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar label={user.email || 'U'} />
            {!collapsed && <><div className="min-w-0 flex-1"><p className="truncate text-sm">{user.email}</p><p className="text-xs text-mute">{isAdmin ? 'Administrator' : 'Account'}</p></div>
              <button aria-label="Sign out" title="Sign out" className="rounded-md p-2 text-mute transition hover:bg-panel2 hover:text-ink" onClick={async () => { await signOut(); onNavigate?.(); nav('/') }}>
                <LogOut className="h-4 w-4" /></button></>}
          </div>
        ) : collapsed ? <Link to="/login" onClick={onNavigate} title="Sign in" className="flex justify-center rounded-md p-2 text-mute hover:bg-panel2 hover:text-ink"><LogOut className="h-4 w-4 rotate-180" /></Link>
          : <Link to="/login" onClick={onNavigate} className="btn w-full">Sign in</Link>}
      </div>
    </div>)
}

export default function Layout() {
  const { pathname } = useLocation(); const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sidebarCollapsed') === '1' } catch { return false } })
  const [width, setWidth] = useState(() => { try { return Number(localStorage.getItem('sidebarWidth')) || 256 } catch { return 256 } })
  const dragging = useRef(false)
  useEffect(() => { window.scrollTo(0, 0); setOpen(false) }, [pathname])
  useEffect(() => { try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0') } catch {} }, [collapsed])
  useEffect(() => { try { localStorage.setItem('sidebarWidth', String(width)) } catch {} }, [width])
  useEffect(() => {
    const move = (e: PointerEvent) => { if (!dragging.current) return; setWidth(Math.min(MAX_W, Math.max(MIN_W, e.clientX))) }
    const up = () => { dragging.current = false; document.body.style.userSelect = '' }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  const contact = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com'
  const sideW = collapsed ? COLLAPSED_W : width
  return (
    <div className="min-h-screen md:flex">
      <aside className="relative hidden shrink-0 border-r border-line bg-panel md:block" style={{ width: sideW, transition: dragging.current ? 'none' : 'width 150ms' }}>
        <div className="sticky top-0 h-screen overflow-y-auto"><SidebarBody collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} /></div>
        {!collapsed && <div onPointerDown={e => { dragging.current = true; document.body.style.userSelect = 'none'; (e.target as HTMLElement).setPointerCapture(e.pointerId) }}
          className="absolute inset-y-0 right-0 w-1 cursor-col-resize hover:bg-accent/40" title="Drag to resize sidebar" />}
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
            <SidebarBody collapsed={false} onToggleCollapse={() => {}} onNavigate={() => setOpen(false)} />
          </div>
        </div>)}
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-line px-4 py-6 text-xs text-mute md:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} ATR'S MARKET. All rights reserved. · Built by Yassine Laouid</span>
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
