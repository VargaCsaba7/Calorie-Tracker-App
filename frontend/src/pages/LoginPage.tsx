import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set by ProtectedRoute when it redirected here
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to track your training and nutrition.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <Field
          label="Username or email"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Alert message={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
