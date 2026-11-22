import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { img, money, size, supabase } from '../lib/supabase'
const OK_FILE = /\.(zip|rar|7z|tar|gz|exe|msi|dmg|pkg|apk|deb|iso|pdf|docx?|xlsx?|pptx?|psd|fig|json|txt)$/i
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const clean = (n: string) => n.replace(/[^\w.-]/g, '_')
const up = async (bucket: string, path: string, f: File) => { const { error } = await supabase.storage.from(bucket).upload(path, f); if (error) throw error; return path }
async function addFile(pid: string, file: File, version: string) {
  const path = await up('product-files', `${pid}/${version}/${Date.now()}-${clean(file.name)}`, file)
  await supabase.from('product_files').update({ is_current: false }).eq('product_id', pid).eq('is_current', true)
  const { error } = await supabase.from('product_files').insert({ product_id: pid, path, version, size_bytes: file.size, is_current: true }); if (error) throw error
  await supabase.from('products').update({ version, file_size_bytes: file.size }).eq('id', pid)
}
const TABS = ['Overview', 'Products', 'Categories', 'Orders', 'Users', 'Files']
export default function Admin() {
  const [tab, setTab] = useState('Overview')
  return (<div><h1 className="mb-4 text-2xl font-semibold">Admin</h1>
    <div className="mb-6 flex gap-2 overflow-x-auto border-b border-line pb-3">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === t ? 'bg-accent text-white' : 'text-mute hover:text-ink'}`}>{t}</button>)}</div>
    {tab === 'Overview' && <Overview />}{tab === 'Products' && <Products />}{tab === 'Categories' && <Categories />}{tab === 'Orders' && <Orders />}{tab === 'Users' && <Users />}{tab === 'Files' && <Files />}</div>)
}
function Overview() {
  const [s, setS] = useState<any>(null); const [r, setR] = useState<any[]>([])
  useEffect(() => { supabase.rpc('admin_stats').then(x => setS(x.data)); supabase.from('purchases').select('*,products(name)').order('created_at', { ascending: false }).limit(8).then(x => setR(x.data || [])) }, [])
  if (!s) return <p className="text-mute">Loading…</p>
  const cards: [string, string][] = [['Products', s.products], ['Users', s.users], ['Paid orders', s.purchases], ['Downloads', s.downloads], ['Revenue', money(s.revenue_cents)], ['Donations', `${money(s.donations_cents || 0)} (${s.donations_count || 0})`]]
  return (<div className="space-y-6"><div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{cards.map(([k, v]) => <div key={k} className="card p-4"><p className="text-xs text-mute">{k}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}</div>
    <div><h2 className="mb-2 font-medium">Recent activity</h2><div className="card divide-y divide-line text-sm">{!r.length && <p className="p-3 text-mute">No orders yet.</p>}{r.map(o => <div key={o.id} className="flex justify-between p-3"><span>{o.products?.name}</span><span className="text-mute">{money(o.amount_cents, o.currency)} · {o.status} · {new Date(o.created_at).toLocaleString()}</span></div>)}</div></div></div>)
}
function Form({ cats, initial, onDone }: any) {
  const [f, setF] = useState<any>(initial ? { ...initial, price: (initial.price_cents / 100).toString() } : { name: '', description: '', category_id: '', version: '1.0.0', pricing: 'free', price: '0', currency: 'usd', system_requirements: '', changelog: '' })
  const [logo, setLogo] = useState<File | null>(null), [shots, setShots] = useState<File[]>([]), [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [existingShots, setExistingShots] = useState<any[]>([])
  useEffect(() => { if (initial?.id) supabase.from('product_images').select('*').eq('product_id', initial.id).order('sort_order').then(r => setExistingShots(r.data || [])) }, [initial?.id])
  async function removeShot(s: any) {
    if (!confirm('Remove this screenshot?')) return
    await supabase.storage.from('product-images').remove([s.path])
    await supabase.from('product_images').delete().eq('id', s.id)
    setExistingShots(prev => prev.filter(x => x.id !== s.id))
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  async function save(e: any) {
    e.preventDefault(); setErr('')
    if ([logo, ...shots].some(i => i && (!/^image\/(png|jpeg|webp)$/.test(i.type) || i.size > 5242880))) return setErr('Images must be PNG, JPG or WEBP, max 5 MB.')
    if (file && !OK_FILE.test(file.name)) return setErr('That file type is not allowed.')
    const cents = Math.round(parseFloat(f.price || '0') * 100)
    if (f.pricing === 'paid' && !(cents >= 50)) return setErr('Paid products need a price of at least 0.50.')
    setBusy(true)
    try {
      const id = initial?.id || crypto.randomUUID()
      const row: any = { name: f.name, description: f.description, category_id: f.category_id || null, pricing: f.pricing, price_cents: f.pricing === 'paid' ? cents : 0, currency: f.currency, system_requirements: f.system_requirements, changelog: f.changelog, version: f.version }
      if (logo) row.logo_url = await up('product-images', `${id}/logo-${Date.now()}-${clean(logo.name)}`, logo)
      const q = initial ? supabase.from('products').update(row).eq('id', id) : supabase.from('products').insert({ ...row, id, slug: slugify(f.name) + '-' + id.slice(0, 4) })
      const { error } = await q; if (error) throw error
      const startIdx = existingShots.length
      for (const [i, s] of shots.entries()) { const p = await up('product-images', `${id}/shot-${Date.now()}-${i}-${clean(s.name)}`, s); await supabase.from('product_images').insert({ product_id: id, path: p, sort_order: startIdx + i }) }
      if (file) await addFile(id, file, f.version)
      onDone()
    } catch (x: any) { setErr(x.message || 'Save failed') } finally { setBusy(false) } }
  const T = (k: string, l: string, p: any = {}) => <div><label className="label">{l}</label><input className="input" value={f[k]} onChange={set(k)} {...p} /></div>
  return (<form onSubmit={save} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
    {T('name', 'Name', { required: true })}{T('version', 'Version', { required: true })}
    <div><label className="label">Category</label><select className="input" value={f.category_id || ''} onChange={set('category_id')}><option value="">None</option>{cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="label">Pricing</label><select className="input" value={f.pricing} onChange={set('pricing')}><option value="free">Free</option><option value="paid">Paid</option></select></div>
      {f.pricing === 'paid' && <div><label className="label">Price (USD)</label><input className="input" type="number" step="0.01" min="0.5" value={f.price} onChange={set('price')} /></div>}</div>
    <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={4} required value={f.description} onChange={set('description')} /></div>
    <div><label className="label">System requirements</label><textarea className="input" rows={3} value={f.system_requirements || ''} onChange={set('system_requirements')} /></div>
    <div><label className="label">Changelog</label><textarea className="input" rows={3} value={f.changelog || ''} onChange={set('changelog')} /></div>
    <div><label className="label">Logo / cover</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setLogo(e.target.files?.[0] || null)} className="text-sm" /></div>
    <div><label className="label">Screenshots</label><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e => setShots(Array.from(e.target.files || []))} className="text-sm" />
      {existingShots.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{existingShots.map(s => (
        <div key={s.id} className="group relative h-16 w-24 overflow-hidden rounded-md border border-line">
          <img src={img(s.path)} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => removeShot(s)} title="Remove screenshot" aria-label="Remove screenshot"
            className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"><X className="h-3 w-3" /></button>
        </div>))}</div>}
    </div>
    <div className="sm:col-span-2"><label className="label">{initial ? 'New product file (becomes the current version)' : 'Product file'}</label><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" /></div>
    {err && <p role="alert" className="text-sm text-red-400 sm:col-span-2">{err}</p>}
    <div className="flex gap-2 sm:col-span-2"><button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Save product'}</button><button type="button" className="btn-ghost" onClick={onDone}>Cancel</button></div></form>)
}
function Products() {
  const [list, setList] = useState<any[]>([]), [cats, setCats] = useState<any[]>([]), [edit, setEdit] = useState<any>(null), [adding, setAdding] = useState(false)
  const load = useCallback(async () => { const [p, c] = await Promise.all([supabase.from('products').select('*').order('created_at', { ascending: false }), supabase.from('categories').select('*').order('name')]); setList(p.data || []); setCats(c.data || []) }, [])
  useEffect(() => { load() }, [load])
  const patch = async (id: string, v: any) => { await supabase.from('products').update(v).eq('id', id); load() }
  async function del(p: any) {
    if (!confirm(`Delete "${p.name}"? Its files are removed permanently.`)) return
    const { data: files } = await supabase.from('product_files').select('path').eq('product_id', p.id)
    if (files?.length) await supabase.storage.from('product-files').remove(files.map(x => x.path))
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) alert(error.message.includes('purchases') ? 'This product has orders and cannot be deleted. Unpublish it instead.' : error.message); load() }
  async function newVersion(p: any, file?: File) {
    if (!file) return; if (!OK_FILE.test(file.name)) return alert('File type not allowed.')
    const v = prompt('Version number for this file?', p.version); if (!v) return
    try { await addFile(p.id, file, v); load() } catch (e: any) { alert(e.message) } }
  if (adding || edit) return <Form cats={cats} initial={edit} onDone={() => { setAdding(false); setEdit(null); load() }} />
  return (<div><button className="btn mb-4" onClick={() => setAdding(true)}>Add product</button>
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-mute"><tr><th className="p-3">Product</th><th>Price</th><th>Published</th><th>Featured</th><th>Actions</th></tr></thead><tbody className="divide-y divide-line">
      {!list.length && <tr><td className="p-4 text-mute" colSpan={5}>No products yet. Click “Add product”.</td></tr>}
      {list.map(p => <tr key={p.id}><td className="p-3">{p.name}<div className="text-xs text-mute">v{p.version} · {size(p.file_size_bytes)}</div></td><td>{money(p.price_cents, p.currency)}</td>
        <td><input type="checkbox" aria-label="Published" checked={p.is_published} onChange={e => patch(p.id, { is_published: e.target.checked })} /></td>
        <td><input type="checkbox" aria-label="Featured" checked={p.is_featured} onChange={e => patch(p.id, { is_featured: e.target.checked })} /></td>
        <td className="space-x-2 py-2"><button className="btn-ghost" onClick={() => setEdit(p)}>Edit</button>
          <label className="btn-ghost cursor-pointer">New file<input type="file" hidden onChange={e => { newVersion(p, e.target.files?.[0]); e.target.value = '' }} /></label>
          <button className="btn-ghost text-red-400" onClick={() => del(p)}>Delete</button></td></tr>)}</tbody></table></div></div>)
}
function Categories() {
  const [list, setList] = useState<any[]>([]), [name, setName] = useState('')
  const load = () => supabase.from('categories').select('*').order('name').then(r => setList(r.data || []))
  useEffect(() => { load() }, [])
  const add = async (e: any) => { e.preventDefault(); const { error } = await supabase.from('categories').insert({ name, slug: slugify(name) }); if (error) alert(error.message); setName(''); load() }
  return (<div className="max-w-xl"><form onSubmit={add} className="mb-4 flex gap-2"><input className="input" required placeholder="New category" value={name} onChange={e => setName(e.target.value)} /><button className="btn">Add</button></form>
    <div className="card divide-y divide-line text-sm">{!list.length && <p className="p-3 text-mute">No categories yet.</p>}{list.map(c => <div key={c.id} className="flex items-center justify-between p-3"><span>{c.name}</span><span className="space-x-2">
      <button className="btn-ghost" onClick={async () => { const n = prompt('Rename', c.name); if (n) { await supabase.from('categories').update({ name: n, slug: slugify(n) }).eq('id', c.id); load() } }}>Rename</button>
      <button className="btn-ghost text-red-400" onClick={async () => { if (confirm('Delete category?')) { await supabase.from('categories').delete().eq('id', c.id); load() } }}>Delete</button></span></div>)}</div></div>)
}
function Orders() {
  const [list, setList] = useState<any[]>([]), [open, setOpen] = useState<any>(null)
  useEffect(() => { supabase.from('purchases').select('*,products(name),profiles(full_name,email)').order('created_at', { ascending: false }).limit(200).then(r => setList(r.data || [])) }, [])
  return (<div><div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-mute"><tr><th className="p-3">Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody className="divide-y divide-line">
    {!list.length && <tr><td className="p-4 text-mute" colSpan={6}>No orders yet.</td></tr>}
    {list.map(o => <tr key={o.id}><td className="p-3">{o.profiles?.full_name || '—'}<div className="text-xs text-mute">{o.profiles?.email}</div></td><td>{o.products?.name}</td><td>{money(o.amount_cents, o.currency)}</td><td>{o.status}</td><td>{new Date(o.created_at).toLocaleDateString()}</td><td><button className="btn-ghost" onClick={() => setOpen(o)}>Details</button></td></tr>)}</tbody></table></div>
    {open && <pre className="card mt-4 overflow-x-auto p-4 text-xs text-mute">{JSON.stringify(open, null, 2)}</pre>}</div>)
}
function Users() {
  const [list, setList] = useState<any[]>([]), [loading, setLoading] = useState(true), [q, setQ] = useState('')
  useEffect(() => { supabase.rpc('admin_list_users').then(r => { setList(r.data || []); setLoading(false) }) }, [])
  const rows = list.filter(u => !q || (u.email || '').toLowerCase().includes(q.toLowerCase()) || (u.full_name || '').toLowerCase().includes(q.toLowerCase()))
  return (<div>
    <div className="mb-4 flex items-center justify-between gap-3">
      <input className="input max-w-xs" placeholder="Search by email or name" value={q} onChange={e => setQ(e.target.value)} />
      <span className="text-sm text-mute">{list.length} registered user{list.length === 1 ? '' : 's'}</span>
    </div>
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-mute"><tr><th className="p-3">Email</th><th>Name</th><th>Role</th><th>Orders</th><th>Joined</th><th>Last login</th></tr></thead><tbody className="divide-y divide-line">
      {loading && <tr><td className="p-4 text-mute" colSpan={6}>Loading…</td></tr>}
      {!loading && !rows.length && <tr><td className="p-4 text-mute" colSpan={6}>No users found.</td></tr>}
      {rows.map(u => <tr key={u.id}><td className="p-3">{u.email}</td><td>{u.full_name || '—'}</td>
        <td>{u.is_admin ? <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">Admin</span> : 'Customer'}</td>
        <td>{u.purchase_count}</td><td>{new Date(u.created_at).toLocaleDateString()}</td>
        <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : 'Never'}</td></tr>)}
    </tbody></table></div></div>)
}
function Files() {
  const [list, setList] = useState<any[]>([])
  const load = () => supabase.from('product_files').select('*,products(name)').order('created_at', { ascending: false }).then(r => setList(r.data || []))
  useEffect(() => { load() }, [])
  const total = list.reduce((a, f) => a + Number(f.size_bytes), 0)
  return (<div><p className="mb-4 text-sm text-mute">Storage used by product files: <span className="text-ink">{size(total)}</span></p>
    <div className="card divide-y divide-line text-sm">{!list.length && <p className="p-3 text-mute">No files uploaded.</p>}{list.map(f => <div key={f.id} className="flex items-center justify-between p-3">
      <span>{f.products?.name} · v{f.version} <span className="text-mute">· {size(f.size_bytes)}</span> {f.is_current && <span className="ml-2 rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">current</span>}</span>
      {!f.is_current && <button className="btn-ghost text-red-400" onClick={async () => { if (!confirm('Delete this old file?')) return; await supabase.storage.from('product-files').remove([f.path]); await supabase.from('product_files').delete().eq('id', f.id); load() }}>Delete</button>}</div>)}</div></div>)
}
