import { useState, useEffect } from 'react'

const mockData = [
  { id: 1, hostname: "dev-station-01", ip: "192.168.1.101", status: "busy", cpu: 78, memory: 62, currentTask: "Uploading logs to AWS S3", lastSeen: "2s ago", os: "Ubuntu 22.04" },
  { id: 2, hostname: "build-server", ip: "192.168.1.102", status: "online", cpu: 12, memory: 34, currentTask: null, lastSeen: "1s ago", os: "macOS Sonoma" },
  { id: 3, hostname: "pc-sam", ip: "192.168.1.103", status: "busy", cpu: 91, memory: 80, currentTask: "Restarting backend service", lastSeen: "3s ago", os: "Windows 11" },
  { id: 4, hostname: "ml-rig", ip: "192.168.1.104", status: "offline", cpu: 0, memory: 0, currentTask: null, lastSeen: "5m ago", os: "Ubuntu 22.04" }
];

const styles = `
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding-bottom: 80px;
  }
  .pc-card {
    background: var(--bg-card);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    padding: 16px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    opacity: 0;
    transform: translateY(20px);
  }
  @media (hover: hover) {
    .pc-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
    }
  }
  .card-enter {
    animation: fadeSlideUp 0.5s ease forwards;
  }
  @keyframes fadeSlideUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .pulse-green {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    animation: pulseGreenAnim 2s infinite;
  }
  @keyframes pulseGreenAnim {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
  .pulse-amber {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
    animation: pulseAmberAnim 1s infinite;
  }
  @keyframes pulseAmberAnim {
    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
    70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  }
  .stat-bar-container {
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 6px;
  }
  .stat-bar-fill {
    height: 100%;
    background: var(--gradient-primary);
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .shimmer-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: shimmerAnim 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmerAnim {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Connection and empty state styling */
  .connection-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid var(--border-glass);
    margin: 0 auto 24px auto;
    width: fit-content;
    font-size: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(12px);
    transition: all 0.3s ease;
  }
  .banner-connected {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: var(--accent-green);
  }
  .banner-disconnected {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    color: var(--accent-amber);
  }
  .banner-dot-green {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); box-shadow: 0 0 8px var(--accent-green); animation: pulseMic 1.5s infinite;
  }
  .banner-dot-amber {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent-amber); opacity: 0.8;
  }

  .empty-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed var(--border-glass);
    border-radius: 16px;
    margin-top: 16px;
    backdrop-filter: blur(8px);
  }
  .empty-icon {
    color: var(--accent-blue);
    margin-bottom: 20px;
    animation: pulseMic 3s infinite ease-in-out;
  }
  @keyframes pulseMic {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Use mock data natively
    const setMockDelay = setTimeout(() => {
      if (mounted) {
        setNodes(mockData);
        setIsConnected(false);
      }
    }, 500);

    const timer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
      // Delay slightly for CSS transition to bite after mounting
      setTimeout(() => setAnimateBars(true), 50);
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(setMockDelay);
      clearTimeout(timer);
    };
  }, [loading]);

  const totalNodes = nodes.length;
  const activeNodes = nodes.filter(n => n.status === 'busy' || n.status === 'online').length;
  const executingNodes = nodes.filter(n => n.status === 'busy').length;

  return (
    <div className="page-enter">
      <style>{styles}</style>

      {/* SPONGY CONNECTION BANNER */}
      <div className={`connection-banner banner-disconnected`}>
        <div className="banner-dot-amber" />
        Live · Nodes
      </div>

      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Fleet Status
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} className="pulse-green" />
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {totalNodes} nodes · {activeNodes} active
          </p>
        </div>
      </header>

      {/* GRID // LOADING MAP */}
      {loading ? (
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="pc-card">
              <div className="shimmer-skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
              <div className="shimmer-skeleton" style={{ width: '40%', height: '14px', marginBottom: '20px' }} />
              <div className="shimmer-skeleton" style={{ width: '100%', height: '30px', borderRadius: '15px', marginBottom: '16px' }} />
              <div className="shimmer-skeleton" style={{ width: '100%', height: '32px', marginBottom: '12px' }} />
              <div className="shimmer-skeleton" style={{ width: '100%', height: '32px' }} />
            </div>
          ))}
        </div>
      ) : isConnected && nodes.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No nodes connected</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.5 }}>
            Start the Turtle agent on your remote PC to see it organically appear here.
          </p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {nodes.map((node, i) => (
            <PcCard key={node.id} node={node} index={i} animateBars={animateBars} />
          ))}
        </div>
      )}

      {/* BOTTOM STATS BAR */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--navbar-height) + var(--safe-area-bottom) + 16px)',
        left: '16px',
        right: '16px',
        maxWidth: '448px',
        margin: '0 auto',
        background: 'rgba(8, 12, 24, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        zIndex: 50,
      }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{executingNodes} of {totalNodes}</span> nodes executing tasks · Policy: ENFORCED 🛡️
      </div>

    </div>
  )
}

function PcCard({ node, index, animateBars }) {
  const isOnline = node.status === 'online';
  const isBusy = node.status === 'busy' || node.status === 'running';
  const isOffline = node.status === 'offline';

  let dotClass = '';
  let dotColor = '';
  if (isOnline) { dotClass = 'pulse-green'; dotColor = 'var(--accent-green)'; }
  else if (isBusy) { dotClass = 'pulse-amber'; dotColor = 'var(--accent-amber)'; }
  else { dotColor = 'var(--accent-red)'; } // Default offline styling red

  return (
    <div className="pc-card card-enter" style={{ animationDelay: `${index * 100}ms` }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{node.hostname}</h3>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>{node.os}</span>
          </div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {node.ip}
          </div>
        </div>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: dotColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {node.status}
          <div className={dotClass} style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
        </div>
      </div>

      {/* Task Badge */}
      <div style={{ marginBottom: '18px', height: '26px' }}>
        {isBusy && (
          <div className="text-truncate" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--accent-amber)',
            padding: '4px 10px',
            borderRadius: '13px',
            fontSize: '0.7rem',
            fontWeight: 600,
            maxWidth: '100%'
          }}>
            ⚡ Running: {node.currentTask}
          </div>
        )}
        {isOnline && !isBusy && (
          <div style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent-green)', padding: '4px 0', fontSize: '0.7rem', fontWeight: 600 }}>
            ● Idle
          </div>
        )}
        {isOffline && (
          <div style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent-red)', padding: '4px 0', fontSize: '0.7rem', fontWeight: 600 }}>
            ● Offline ({node.lastSeen})
          </div>
        )}
      </div>

      {/* Stats */}
      {(!isOffline) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>CPU</span>
              <span style={{ color: 'var(--text-primary)' }}>{node.cpu}%</span>
            </div>
            <div className="stat-bar-container">
              <div
                className="stat-bar-fill"
                style={{
                  width: animateBars ? `${node.cpu}%` : '0%',
                  transitionDelay: '0s'
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>MEMORY</span>
              <span style={{ color: 'var(--text-primary)' }}>{node.memory}%</span>
            </div>
            <div className="stat-bar-container">
              <div
                className="stat-bar-fill"
                style={{
                  width: animateBars ? `${node.memory}%` : '0%',
                  transitionDelay: '0.15s'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Offline state (Greyed out bars) */}
      {isOffline && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', opacity: 0.3 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>CPU</span>
              <span>--</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill" style={{ width: '0%', background: 'var(--text-secondary)' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>MEMORY</span>
              <span>--</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill" style={{ width: '0%', background: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
