import { useEffect, useState } from 'react'
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (document.documentElement.getAttribute('data-theme') as any) || 'dark')
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); try { localStorage.setItem('theme', theme) } catch {} }, [theme])
  return { theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }
}
