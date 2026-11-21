import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
export default function Reviews({ productId, canReview }: { productId: string; canReview: boolean }) {
  const { user } = useAuth(); const [list, setList] = useState<any[]>([]); const [rating, setRating] = useState(5), [body, setBody] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const load = useCallback(() => supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false }).then(r => setList(r.data || [])), [productId])
  useEffect(() => { load() }, [load])
  const avg = list.length ? (list.reduce((a, r) => a + r.rating, 0) / list.length).toFixed(1) : null
  async function submit(e: any) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await supabase.from('reviews').insert({ user_id: user.id, product_id: productId, rating, body: body.trim() || null })
    setBusy(false)
    if (error) return setErr(error.code === '23505' ? 'You already reviewed this product.' : 'Could not post your review.')
    setBody(''); load() }
  const mine = user && list.some(r => r.user_id === user.id)
  return (
    <section><h2 className="mb-3 text-lg font-medium">Reviews {avg && <span className="text-sm text-mute">· {avg} ★ ({list.length})</span>}</h2>
      {user && canReview && !mine && <form onSubmit={submit} className="card mb-4 space-y-3 p-4">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star className={`h-5 w-5 ${n <= rating ? 'fill-accent text-accent' : 'text-mute'}`} /></button>)}</div>
        <textarea className="input" rows={3} maxLength={2000} placeholder="Share your experience (optional)" value={body} onChange={e => setBody(e.target.value)} />
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}<button className="btn" disabled={busy}>{busy ? 'Posting…' : 'Post review'}</button></form>}
      {!user && <p className="mb-3 text-sm text-mute">Sign in to leave a review.</p>}
      {user && !canReview && <p className="mb-3 text-sm text-mute">Purchase this product to leave a review.</p>}
      {!list.length ? <p className="text-sm text-mute">No reviews yet.</p> : <div className="card divide-y divide-line">{list.map(r => <div key={r.id} className="p-4 text-sm">
        <div className="flex items-center justify-between"><span className="font-medium">{r.author_name || 'Customer'} <span className="text-accent">{'★'.repeat(r.rating)}</span></span>
          <span className="text-xs text-mute">{new Date(r.created_at).toLocaleDateString()}{user?.id === r.user_id && <button className="ml-3 text-red-400" onClick={async () => { await supabase.from('reviews').delete().eq('id', r.id); load() }}>Delete</button>}</span></div>
        {r.body && <p className="mt-1 whitespace-pre-line text-mute">{r.body}</p>}</div>)}</div>}
    </section>)
}
