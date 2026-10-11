import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-bold text-brand-700">Calorie Tracker</span>

          {/* Full-width second row on phones, inline on larger screens */}
          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium sm:flex-none ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
