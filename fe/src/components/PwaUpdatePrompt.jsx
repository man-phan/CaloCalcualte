import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-banner" role="alert" aria-live="polite">
      <span className="pwa-update-text">
        ?? Có phiên b?n m?i — c?p nh?t ngay?
      </span>
      <div className="pwa-update-actions">
        <button
          className="pwa-update-btn"
          onClick={() => updateServiceWorker(true)}
        >
          C?p nh?t
        </button>
        <button
          className="pwa-update-dismiss"
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update prompt"
        >
          ?
        </button>
      </div>
    </div>
  );
}
