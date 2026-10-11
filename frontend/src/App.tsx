import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { NutritionPage } from './pages/NutritionPage'
import { RegisterPage } from './pages/RegisterPage'

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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Placeholder title="Dashboard" />} />
              <Route path="/workouts" element={<Placeholder title="Workouts" />} />
              <Route path="/nutrition" element={<NutritionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
