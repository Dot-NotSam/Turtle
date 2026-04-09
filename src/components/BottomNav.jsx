import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  {
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    path: '/command',
    label: 'Command',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    path: '/output',
    label: 'Output',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
]

const navStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 'calc(var(--navbar-height) + var(--safe-area-bottom))',
  paddingBottom: 'var(--safe-area-bottom)',
  background: 'rgba(8, 12, 24, 0.85)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderTop: '1px solid var(--border-glass)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  zIndex: 100,
}

const tabBaseStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 16px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  position: 'relative',
  transition: 'color 0.2s ease',
  fontFamily: 'var(--font-family)',
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={navStyle} id="bottom-nav">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            id={`nav-${tab.label.toLowerCase()}`}
            onClick={() => navigate(tab.path)}
            style={{
              ...tabBaseStyle,
              color: isActive ? '#e2e8f0' : 'var(--text-secondary)',
            }}
          >
            <div style={{
              color: isActive ? '#3b82f6' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              ...(isActive ? { animation: 'glow-pulse 2s ease-in-out infinite' } : {}),
            }}>
              {tab.icon}
            </div>
            <span>{tab.label}</span>
            {/* Active Indicator */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isActive ? '24px' : '0px',
              height: '2px',
              borderRadius: '2px',
              background: isActive ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'transparent',
              transition: 'width 0.3s ease, background 0.3s ease',
              boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
            }} />
          </button>
        )
      })}
    </nav>
  )
}
