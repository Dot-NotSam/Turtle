import BottomNav from './BottomNav.jsx'

const layoutStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  position: 'relative',
}

const mainStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingBottom: 'calc(var(--navbar-height) + var(--safe-area-bottom) + 16px)',
}

const contentWrapperStyle = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '0 16px',
  width: '100%',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 0 8px 0',
}

const logoStyle = {
  fontSize: '1.25rem',
  fontWeight: 800,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  userSelect: 'none',
}

const statusDotStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.7rem',
  fontWeight: 500,
  color: 'var(--accent-green)',
  letterSpacing: '0.05em',
}

const dotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--accent-green)',
  boxShadow: '0 0 8px var(--accent-green)',
  animation: 'status-blink 2s ease-in-out infinite',
}

export default function Layout({ children }) {
  return (
    <div style={layoutStyle}>
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="bg-orb bg-orb--1" />
        <div className="bg-orb bg-orb--2" />
        <div className="bg-orb bg-orb--3" />
      </div>

      <main style={mainStyle}>
        <div style={contentWrapperStyle}>
          <header style={headerStyle}>
            <span style={logoStyle}>OpenClaw</span>
            <div style={statusDotStyle}>
              <div style={dotStyle} />
              CONNECTED
            </div>
          </header>
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
