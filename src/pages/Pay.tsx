import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Paddle "default payment link" page. Paddle.js opens the checkout automatically from the ?_ptxn= parameter.
export default function Pay() {
  const nav = useNavigate(); const [err, setErr] = useState(''); const done = useRef(false)
  useEffect(() => {
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
    if (!token) { setErr('Payments are not configured yet.'); return }
    const s = document.createElement('script'); s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    s.onload = () => {
      const P = (window as any).Paddle
      if (import.meta.env.VITE_PADDLE_ENV !== 'production') P.Environment.set('sandbox')
      P.Initialize({ token, checkout: { settings: { displayMode: 'overlay', successUrl: `${location.origin}/library?checkout=success` } },
        eventCallback: (e: any) => {
          if (e.name === 'checkout.completed') { done.current = true; setTimeout(() => nav('/library?checkout=success'), 1500) }
          if (e.name === 'checkout.closed' && !done.current) nav('/explore') } })
    }
    s.onerror = () => setErr('Could not load the payment form. Please try again.')
    document.body.appendChild(s); return () => { s.remove() }
  }, [])
  return <p className={`py-20 text-center ${err ? 'text-red-400' : 'text-mute'}`}>{err || 'Opening secure checkout…'}</p>
}
