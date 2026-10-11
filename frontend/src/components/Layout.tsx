import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Logo } from './Logo'
import { Button } from './ui/Button'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/profile', label: 'Profile' },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-rubber text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo />

          {/* Full-width second row on phones, inline on larger screens */}
          <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex-1 rounded-full px-3.5 py-1.5 text-center font-display text-lg font-semibold tracking-wide whitespace-nowrap sm:flex-none ${
                    isActive ? 'bg-white text-rubber' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-white/60 md:inline">{user?.username}</span>
            <Button variant="inverse" size="sm" onClick={logout}>
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
