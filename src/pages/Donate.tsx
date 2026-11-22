import { useState } from 'react'
import { Heart } from 'lucide-react'
import { donate } from '../lib/supabase'
const PRESETS = [5, 10, 25, 50]
export default function Donate() {
  const [amount, setAmount] = useState(10); const [custom, setCustom] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  const value = custom ? Math.round(Number(custom) * 100) : amount * 100
  const valid = value >= 100 && value <= 100000
  async function go() { setBusy(true); try { await donate(value, message) } finally { setBusy(false) } }
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent"><Heart className="h-5 w-5" /></span>
        <div><h1 className="text-xl font-semibold">Support ATR'S MARKET</h1><p className="text-sm text-mute">Donations help us keep the servers running and add new products.</p></div></div>
      <div className="card space-y-5 p-6">
        <div><label className="label">Choose an amount</label>
          <div className="grid grid-cols-4 gap-2">{PRESETS.map(v => (
            <button key={v} type="button" onClick={() => { setAmount(v); setCustom('') }}
              className={`rounded-md border px-3 py-2.5 text-sm transition ${!custom && amount === v ? 'border-accent bg-accent/10 text-accent' : 'border-line text-mute hover:text-ink'}`}>${v}</button>))}</div>
        </div>
        <div><label className="label">Or enter a custom amount (USD)</label>
          <input className="input" type="number" min={1} max={1000} step="0.5" placeholder="e.g. 15" value={custom} onChange={e => setCustom(e.target.value)} /></div>
        <div><label className="label">Message (optional)</label>
          <textarea className="input" rows={3} maxLength={300} placeholder="Say something nice…" value={message} onChange={e => setMessage(e.target.value)} /></div>
        {!valid && <p className="text-sm text-red-400">Choose an amount between $1 and $1,000.</p>}
        <button className="btn w-full" disabled={!valid || busy} onClick={go}>{busy ? 'Redirecting…' : `Donate $${(value / 100).toFixed(2)}`}</button>
        <p className="text-center text-xs text-mute">Payments are processed securely by Paddle. Donations are not refundable products and carry no additional benefits.</p>
      </div>
    </div>)
}
