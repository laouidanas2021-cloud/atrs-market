import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Product from './pages/Product'
import Auth, { Reset } from './pages/Auth'
import Library from './pages/Library'
import Admin from './pages/Admin'
import Pay from './pages/Pay'
import Donate from './pages/Donate'
import Legal from './pages/Legal'
function Guard({ children, admin }: any) {
  const { user, isAdmin, loading } = useAuth(); const loc = useLocation()
  if (loading) return <p className="py-20 text-center text-mute">Loading…</p>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
export default function App() {
  return (
    <Routes><Route element={<Layout />}>
      <Route index element={<Guard><Home /></Guard>} /><Route path="explore" element={<Guard><Explore /></Guard>} />
      <Route path="product/:slug" element={<Guard><Product /></Guard>} /><Route path="login" element={<Auth />} /><Route path="reset" element={<Reset />} />
      <Route path="pay" element={<Guard><Pay /></Guard>} /><Route path="donate" element={<Guard><Donate /></Guard>} />
      {['terms', 'privacy', 'refund', 'about', 'contact'].map(k => <Route key={k} path={k} element={<Legal />} />)}
      <Route path="library" element={<Guard><Library /></Guard>} />
      <Route path="admin" element={<Guard admin><Admin /></Guard>} />
      <Route path="*" element={<p className="py-20 text-center text-mute">Page not found.</p>} />
    </Route></Routes>)
}
