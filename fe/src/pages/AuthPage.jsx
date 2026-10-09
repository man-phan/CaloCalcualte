import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = tab === 'login' ? authApi.login : authApi.register;
      const data = await fn(username, password);
      saveAuth(data.token, data.user);
      // user.gender is null → onboarding; else home
      const needsOnboarding = !data.user?.gender;
      navigate(needsOnboarding ? '/onboarding' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-mark">CC</div>
        <div className="auth-logo-text">
          Calo Calculate
          <small>Theo dõi dinh dưỡng hàng ngày</small>
        </div>
      </div>

      <h1 style={{ marginBottom: 8 }}>
        {tab === 'login' ? 'Chào mừng trở lại 👋' : 'Tạo tài khoản mới'}
      </h1>
      <p style={{ marginBottom: 28 }}>
        {tab === 'login'
          ? 'Đăng nhập để tiếp tục hành trình sức khoẻ của bạn.'
          : 'Bắt đầu theo dõi dinh dưỡng của bạn ngay hôm nay.'}
      </p>

      {/* Tab switcher */}
      <div className="auth-tabs">
        <button
          className={`auth-tab${tab === 'login' ? ' active' : ''}`}
          onClick={() => { setTab('login'); setError(''); }}
        >
          Đăng nhập
        </button>
        <button
          className={`auth-tab${tab === 'register' ? ' active' : ''}`}
          onClick={() => { setTab('register'); setError(''); }}
        >
          Đăng ký
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Tên đăng nhập</label>
          <input
            id="auth-username"
            className="form-input"
            type="text"
            placeholder="nhập tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mật khẩu</label>
          <input
            id="auth-password"
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
          />
        </div>

        <div className="mt-8">
          <button id="auth-submit" className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Đang xử lý...
              </>
            ) : tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </div>
      </form>
    </div>
  );
}
