import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Forge', to: '/forge' },
  { label: 'About', to: '/about' },
]

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__wordmark">OMNIFORGE</div>
        <nav className="layout__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `layout__nav-link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
