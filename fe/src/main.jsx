import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Auto-reload once when a hashed chunk fails to load (stale PWA cache after deployment)
window.addEventListener('vite:preloadError', () => {
  const reloaded = sessionStorage.getItem('pwa_chunk_reload');
  if (!reloaded) {
    sessionStorage.setItem('pwa_chunk_reload', '1');
    window.location.reload();
  }
});
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import ToastContainer from './components/Toast.jsx';
import PwaUpdatePrompt from './components/PwaUpdatePrompt.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer />
        <PwaUpdatePrompt />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
