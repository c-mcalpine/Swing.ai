import { useNavigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import '../styles/components/BottomNav.css'

function BottomNav({ activePage }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active page from route if not explicitly provided
  const currentPage = activePage || getCurrentPageFromRoute(location.pathname)

  function getCurrentPageFromRoute(pathname) {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/review')) return 'review'
    if (pathname.startsWith('/leaderboard')) return 'challenge'
    if (pathname.startsWith('/profile')) return 'profile'
    return null
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: 'home', route: '/' },
    { id: 'review', label: 'Review', icon: 'history', route: '/review' },
    { id: 'fab', label: 'Record', icon: 'add', route: '/record' }, // Special FAB item
    { id: 'challenge', label: 'Challenge', icon: 'emoji_events', route: '/leaderboard' },
    { id: 'profile', label: 'Profile', icon: 'person', route: '/profile' }
  ]

  const handleNavigation = (route) => {
    navigate(route)
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__container">
        {navItems.map((item) => {
          if (item.id === 'fab') {
            // Render floating action button
            return (
              <div key={item.id} className="bottom-nav__fab-wrapper">
                <button
                  className="bottom-nav__fab"
                  onClick={() => handleNavigation(item.route)}
                  aria-label={item.label}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </button>
              </div>
            )
          }

          // Render regular nav button
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              className={`bottom-nav__btn ${isActive ? 'bottom-nav__btn--active' : ''}`}
              onClick={() => handleNavigation(item.route)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

BottomNav.propTypes = {
  activePage: PropTypes.oneOf(['home', 'review', 'challenge', 'profile'])
}

export default BottomNav

