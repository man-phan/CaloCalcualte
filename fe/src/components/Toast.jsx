import { useState, useCallback } from 'react';

let _setToasts;

export function useToast() {
  const show = useCallback((message, type = 'default') => {
    if (_setToasts) {
      const id = Date.now();
      _setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        _setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }
  }, []);
  return { show };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const typeStyle = (type) => {
    if (type === 'error') return { borderColor: 'rgba(248,113,113,0.4)', color: 'var(--danger)' };
    if (type === 'success') return { borderColor: 'rgba(94,234,212,0.4)', color: 'var(--accent)' };
    return {};
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={typeStyle(t.type)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
