import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const { user, register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSignedUp, setJustSignedUp] = useState(false)

  if (user) {
    // Right after signing up, continue to the profile so calorie needs can be set
    return <Navigate to={justSignedUp ? '/profile?welcome' : '/'} replace />
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    setJustSignedUp(true)
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } catch (err) {
      setJustSignedUp(false)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create an account" subtitle="Next you can add your body data to get a calorie target.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <Field
          label="Username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={50}
          pattern="[A-Za-z0-9_]+"
          title="Letters, numbers and underscores only"
          value={form.username}
          onChange={(e) => update('username', e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
        />
        <Alert message={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 underline decoration-brand-100 decoration-2 underline-offset-4 hover:decoration-brand-600">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
