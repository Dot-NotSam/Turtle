import { useState, useEffect } from 'react';
import { subscribeToasts } from '../utils/toast';

const styles = `
  .global-toast-container {
    position: fixed;
    top: 80px;
    right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }
  .global-toast {
    pointer-events: auto;
    padding: 12px 16px;
    border-radius: 12px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    font-size: 0.75rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    border: 1px solid;
    opacity: 0;
    transform: translateX(120%);
    animation: slideInGlobalToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    background: rgba(8, 12, 24, 0.85);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .global-toast.toast-success { border-color: rgba(34, 197, 94, 0.5); }
  .global-toast.toast-error { border-color: rgba(239, 68, 68, 0.5); }
  .global-toast.toast-warning { border-color: rgba(245, 158, 11, 0.5); }
  .global-toast.toast-info { border-color: rgba(59, 130, 246, 0.5); }
  
  @keyframes slideInGlobalToast {
    to { opacity: 1; transform: translateX(0); }
  }
`;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToasts((t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(current => current.filter(x => x.id !== t.id));
      }, 3500);
    });
  }, []);

  return (
    <div className="global-toast-container">
      <style>{styles}</style>
      {toasts.map(t => (
        <div key={t.id} className={`global-toast toast-${t.type}`}>
          {t.type === 'success' && <span>✅</span>}
          {t.type === 'error' && <span>❌</span>}
          {t.type === 'warning' && <span>⚠️</span>}
          {t.type === 'info' && <span>ℹ️</span>}
          {t.message}
        </div>
      ))}
    </div>
  );
}
