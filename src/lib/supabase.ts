import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const money = (c: number, cur = 'usd') => c === 0 ? 'Free' : new Intl.NumberFormat('en', { style: 'currency', currency: cur }).format(c / 100)
export const img = (p?: string | null) => p ? supabase.storage.from('product-images').getPublicUrl(p).data.publicUrl : ''
export const size = (b?: number | null) => b ? (b / 1048576).toFixed(1) + ' MB' : '—'
async function fn(name: string, productId: string) {
  const { data, error } = await supabase.functions.invoke(name, { body: { productId } })
  if (error || !data?.url) {
    let m = 'Something went wrong. Please try again.'
    try { m = (await (error as any).context.json()).error || m } catch {}
    alert(m); return
  }
  window.location.href = data.url
}
export const download = (id: string) => fn('get-download-url', id)
export const checkout = (id: string) => fn('create-checkout', id)
export async function donate(amountCents: number, message: string) {
  const { data, error } = await supabase.functions.invoke('create-donation', { body: { amountCents, message } })
  if (error || !data?.url) {
    let m = 'Something went wrong. Please try again.'
    try { m = (await (error as any).context.json()).error || m } catch {}
    alert(m); return
  }
  window.location.href = data.url
}
