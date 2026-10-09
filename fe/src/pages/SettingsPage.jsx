import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalsApi } from '../api/goals.js';
import { usersApi } from '../api/users.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import BottomNav from '../components/BottomNav.jsx';

function getGoalHint(val) {
  if (val <= 0.2) return { status: 'SLOW', label: 'Giảm chậm', msg: 'Nhẹ nhàng và dễ duy trì.' };
  if (val <= 0.7) return { status: 'MODERATE', label: 'Hợp lý', msg: 'Mức phổ biến, cân bằng tốt.' };
  return { status: 'HIGH', label: 'Nhanh', msg: 'Có thể khó duy trì, cần cẩn thận.' };
}

const ACTIVITY_OPTIONS = [
  { value: 'LOW',         label: 'Ít vận động' },
  { value: 'LIGHT',       label: 'Nhẹ' },
  { value: 'MODERATE',    label: 'Vừa phải' },
  { value: 'ACTIVE',      label: 'Năng động' },
  { value: 'VERY_ACTIVE', label: 'Rất năng động' },
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  // ── PWA install prompt ──────────────────────────────────────────
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled]       = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const installed = () => { setIsInstalled(true); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };


  // ── Goal state ─────────────────────────────────────────────
  const [lossKgPerMonth, setLossKgPerMonth] = useState(0.5);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError]     = useState('');
  const [goalSaved, setGoalSaved]     = useState(false);

  // ── Health metrics edit state ──────────────────────────────
  const [editing, setEditing]             = useState(false);
  const [gender, setGender]               = useState(user?.gender ?? '');
  const [birthYear, setBirthYear]         = useState(user?.birthYear ?? '');
  const [heightCm, setHeightCm]           = useState(user?.heightCm ?? '');
  const [weightKg, setWeightKg]           = useState(user?.weightKg ?? '');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel ?? '');
  const [metricLoading, setMetricLoading] = useState(false);
  const [metricError, setMetricError]     = useState('');

  // ── Load active goal ───────────────────────────────────────
  useState(() => {
    goalsApi.getActiveGoal()
      .then((data) => {
        if (data?.goal?.lossKgPerMonth != null) {
          setLossKgPerMonth(data.goal.lossKgPerMonth);
        }
      })
      .catch(() => {});
  });

  const hint = getGoalHint(lossKgPerMonth);

  // ── Handlers ───────────────────────────────────────────────
  const saveGoal = async () => {
    setGoalError('');
    setGoalLoading(true);
    setGoalSaved(false);
    try {
      await goalsApi.createGoal(lossKgPerMonth);
      show('Đã cập nhật mục tiêu mới! 🎯', 'success');
      setGoalSaved(true);
    } catch (err) {
      setGoalError(err.message);
    } finally {
      setGoalLoading(false);
    }
  };

  const startEdit = () => {
    // Reset to current user values each time we open the form
    setGender(user?.gender ?? '');
    setBirthYear(user?.birthYear ?? '');
    setHeightCm(user?.heightCm ?? '');
    setWeightKg(user?.weightKg ?? '');
    setActivityLevel(user?.activityLevel ?? '');
    setMetricError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setMetricError('');
    setEditing(false);
  };

  const saveMetrics = async () => {
    setMetricError('');

    // Basic validation
    const wKg   = Number(weightKg);
    const hCm   = Number(heightCm);
    const bYear = Number(birthYear);
    const maxBirth = new Date().getFullYear() - 10;

    if (!gender)                        return setMetricError('Vui lòng chọn giới tính.');
    if (bYear < 1900 || bYear > maxBirth) return setMetricError(`Năm sinh phải từ 1900 đến ${maxBirth}.`);
    if (hCm <= 0 || hCm > 300)          return setMetricError('Chiều cao không hợp lệ (1–300 cm).');
    if (wKg <= 0 || wKg > 500)          return setMetricError('Cân nặng không hợp lệ (1–500 kg).');
    if (!activityLevel)                 return setMetricError('Vui lòng chọn mức độ vận động.');

    setMetricLoading(true);
    try {
      const updated = await usersApi.updateProfile({
        gender,
        birthYear: bYear,
        heightCm: hCm,
        weightKg: wKg,
        activityLevel,
      });
      updateUser(updated);
      show('Cập nhật chỉ số sức khỏe thành công! 💪', 'success');
      setEditing(false);
    } catch (err) {
      setMetricError(err.message);
    } finally {
      setMetricLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span>CC</span> Cài đặt
        </div>
      </header>

      <div className="page-content">

        {/* ── Profile / Health Metrics Card ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="section-label">Chỉ số sức khỏe</div>
            {!editing && (
              <button
                id="edit-metrics-btn"
                onClick={startEdit}
                style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: 8,
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {!editing ? (
            /* ── View mode ── */
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '2px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0,
              }}>
                {(user?.username || user?.email)?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.username || user?.email}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  {user?.gender === 'MALE' ? 'Nam' : 'Nữ'} · {user?.birthYear} · {user?.heightCm} cm · {user?.weightKg} kg
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {ACTIVITY_OPTIONS.find(o => o.value === user?.activityLevel)?.label ?? '—'}
                </div>
              </div>
            </div>
          ) : (
            /* ── Edit mode ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {metricError && <div className="alert alert-error">{metricError}</div>}

              {/* Gender */}
              <div>
                <label className="form-label" style={{ marginBottom: 6 }}>Giới tính</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ v: 'MALE', l: '♂ Nam' }, { v: 'FEMALE', l: '♀ Nữ' }].map(({ v, l }) => (
                    <button
                      key={v}
                      id={`metrics-gender-${v.toLowerCase()}`}
                      onClick={() => setGender(v)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${gender === v ? 'var(--accent)' : 'var(--border)'}`,
                        background: gender === v ? 'var(--accent-dim)' : 'transparent',
                        color: gender === v ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Birth Year */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Năm sinh</label>
                <input
                  id="metrics-birthyear"
                  className="form-input"
                  type="number"
                  placeholder="2000"
                  min="1900"
                  max={new Date().getFullYear() - 10}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                />
              </div>

              {/* Height & Weight side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chiều cao (cm)</label>
                  <input
                    id="metrics-height"
                    className="form-input"
                    type="number"
                    placeholder="168"
                    min="50"
                    max="300"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cân nặng (kg)</label>
                  <input
                    id="metrics-weight"
                    className="form-input"
                    type="number"
                    placeholder="65"
                    min="20"
                    max="500"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="form-label" style={{ marginBottom: 6 }}>Mức độ vận động</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      id={`metrics-activity-${opt.value.toLowerCase()}`}
                      onClick={() => setActivityLevel(opt.value)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${activityLevel === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                        background: activityLevel === opt.value ? 'var(--accent-dim)' : 'transparent',
                        color: activityLevel === opt.value ? 'var(--accent)' : 'var(--text)',
                        fontWeight: activityLevel === opt.value ? 600 : 400,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  id="save-metrics-btn"
                  className="btn btn-primary"
                  onClick={saveMetrics}
                  disabled={metricLoading}
                  style={{ flex: 1 }}
                >
                  {metricLoading ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Đang lưu...
                    </>
                  ) : 'Lưu thay đổi'}
                </button>
                <button
                  id="cancel-metrics-btn"
                  className="btn btn-ghost"
                  onClick={cancelEdit}
                  disabled={metricLoading}
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Goal Card ── */}
        <div className="card" style={{ marginTop: 12 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Thay đổi mục tiêu giảm cân</div>
          <p style={{ fontSize: '0.82rem', marginBottom: 16 }}>
            Điều chỉnh tốc độ giảm cân theo tháng. Mục tiêu mới sẽ được áp dụng ngay lập tức.
          </p>

          {goalError && <div className="alert alert-error">{goalError}</div>}
          {goalSaved && <div className="alert alert-success">Mục tiêu đã được cập nhật!</div>}

          <div className="slider-value">{lossKgPerMonth.toFixed(1)} kg/tháng</div>
          <div className="slider-wrap">
            <input
              id="settings-goal-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={lossKgPerMonth}
              onChange={(e) => { setLossKgPerMonth(parseFloat(e.target.value)); setGoalSaved(false); }}
            />
            <div className="slider-labels">
              <span>0.1 kg</span>
              <span>1.0 kg</span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className={`goal-badge ${hint.status}`}>● {hint.label}</div>
            <p style={{ fontSize: '0.83rem' }}>{hint.msg}</p>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              id="save-goal"
              className="btn btn-primary"
              onClick={saveGoal}
              disabled={goalLoading}
            >
              {goalLoading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Đang lưu...
                </>
              ) : 'Lưu mục tiêu mới'}
            </button>
          </div>
        </div>


        {/* Logout */}
        <div style={{ marginTop: 20 }}>
          <button id="logout-btn" className="btn btn-danger" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
