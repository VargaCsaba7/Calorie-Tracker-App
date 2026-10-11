import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'

// Temporary until the real pages are built
function Placeholder({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold text-brand-600">{title}</h1>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Placeholder title="Login" />} />
          <Route path="/register" element={<Placeholder title="Register" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Placeholder title="Dashboard" />} />
            <Route path="/workouts" element={<Placeholder title="Workouts" />} />
            <Route path="/nutrition" element={<Placeholder title="Nutrition" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
