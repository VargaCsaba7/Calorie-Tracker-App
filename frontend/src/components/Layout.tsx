import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Logo } from './Logo'
import { Button } from './ui/Button'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/nutrition', label: 'Nutrition' },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-chalk/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo />

          {/* Full-width second row on phones, inline on larger screens */}
          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex-1 rounded-full px-4 py-1.5 text-center font-display text-lg font-semibold tracking-wide sm:flex-none ${
                    isActive ? 'bg-brand-600 text-white' : 'text-brand-500 hover:bg-black/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-brand-500 sm:inline">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
