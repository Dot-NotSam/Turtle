let toastListeners = new Set();

export const toast = {
  success: (message) => notify({ message, type: 'success' }),
  error: (message) => notify({ message, type: 'error' }),
  warning: (message) => notify({ message, type: 'warning' }),
  info: (message) => notify({ message, type: 'info' }),
};

function notify(data) {
  const t = { id: Date.now() + Math.random().toString(), ...data };
  toastListeners.forEach(l => l(t));
}

export function subscribeToasts(listener) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}
