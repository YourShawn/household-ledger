import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Items } from './pages/Items'
import { ItemEditor } from './pages/ItemEditor'
import { Recipients } from './pages/Recipients'
import { Settings } from './pages/Settings'
import { ShareView } from './pages/ShareView'
import { useSession } from './session'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useSession()
  if (loading) return <p className="landing">{'…'}</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/share/:token" element={<ShareView />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="items/new" element={<ItemEditor />} />
        <Route path="items/:id" element={<ItemEditor />} />
        <Route path="recipients" element={<Recipients />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
