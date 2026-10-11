import { Navigate, Outlet, useLocation } from 'react-router'
import { Logo } from '../components/Logo'
import { useAuth } from './useAuth'

/** Renders child routes for logged-in users, otherwise redirects to /login. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center opacity-60" role="status" aria-label="Loading">
        <Logo />
      </div>
    )
  }
  if (!user) {
    // Remember where the user wanted to go, so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
