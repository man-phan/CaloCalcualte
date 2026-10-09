import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.js';
import { goalsApi } from '../api/goals.js';
import { useAuth } from '../context/AuthContext.jsx';

const TOTAL_STEPS = 6;

const ACTIVITY_OPTIONS = [
  { value: 'LOW',        title: 'Ít vận động',       desc: 'Ngồi nhiều, ít hoặc không tập thể dục' },
  { value: 'LIGHT',      title: 'Nhẹ',                desc: 'Tập nhẹ 1–3 ngày/tuần' },
  { value: 'MODERATE',   title: 'Vừa phải',           desc: 'Tập vừa 3–5 ngày/tuần' },
  { value: 'ACTIVE',     title: 'Năng động',          desc: 'Tập nặng 6–7 ngày/tuần' },
  { value: 'VERY_ACTIVE',title: 'Rất năng động',      desc: 'Tập nặng 2 lần/ngày hoặc công việc thể chất' },
];

function getGoalHint(val) {
  if (val <= 0.2) return { status: 'SLOW', label: 'Giảm chậm', msg: 'Nhẹ nhàng và dễ duy trì.' };
  if (val <= 0.7) return { status: 'MODERATE', label: 'Hợp lý', msg: 'Mức phổ biến, cân bằng tốt.' };
  return { status: 'HIGH', label: 'Nhanh', msg: 'Có thể khó duy trì, cần cẩn thận.' };
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [lossKgPerMonth, setLossKgPerMonth] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  const canNext = () => {
    if (step === 1) return !!gender;
    if (step === 2) return birthYear >= 1900 && birthYear <= new Date().getFullYear() - 10;
    if (step === 3) return heightCm > 0 && heightCm <= 300;
    if (step === 4) return weightKg > 0 && weightKg <= 500;
    if (step === 5) return !!activityLevel;
    return true;
  };

  const finish = async () => {
    setError('');
    setLoading(true);
    try {
      const profile = await usersApi.updateProfile({
        gender,
        birthYear: Number(birthYear),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
      });
      await goalsApi.createGoal(lossKgPerMonth);
      updateUser(profile);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hint = getGoalHint(lossKgPerMonth);

  return (
    <div className="onboarding-page">
      {/* Stepper */}
      <div className="stepper">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`step-dot${i + 1 < step ? ' done' : i + 1 === step ? ' active' : ''}`}
          />
        ))}
      </div>

      <div className="onboarding-header">
        <div className="onboarding-eyebrow">Bước {step}/{TOTAL_STEPS}</div>
        <h1>
          {step === 1 && 'Giới tính của bạn?'}
          {step === 2 && 'Năm sinh của bạn?'}
          {step === 3 && 'Chiều cao của bạn?'}
          {step === 4 && 'Cân nặng hiện tại?'}
          {step === 5 && 'Mức độ vận động?'}
          {step === 6 && 'Mục tiêu giảm cân?'}
        </h1>
        <p style={{ marginTop: 8 }}>
          {step === 1 && 'Dùng để tính chỉ số BMR chính xác hơn.'}
          {step === 2 && 'Tuổi ảnh hưởng đến nhu cầu calo của bạn.'}
          {step === 3 && 'Nhập chiều cao bằng centimét.'}
          {step === 4 && 'Cân nặng hiện tại của bạn (kg).'}
          {step === 5 && 'Chọn mức độ phù hợp nhất với cuộc sống của bạn.'}
          {step === 6 && 'Chúng tôi sẽ tính lượng calo phù hợp cho bạn.'}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="onboarding-content">
        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="gender-grid">
            <div
              className={`gender-card${gender === 'MALE' ? ' selected' : ''}`}
              onClick={() => setGender('MALE')}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="14" r="6"/><path d="M20 4l-6 6M14 4h6v6"/>
              </svg>
              Nam
            </div>
            <div
              className={`gender-card${gender === 'FEMALE' ? ' selected' : ''}`}
              onClick={() => setGender('FEMALE')}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/>
              </svg>
              Nữ
            </div>
          </div>
        )}

        {/* Step 2: Birth Year */}
        {step === 2 && (
          <div className="form-group">
            <label className="form-label">Năm sinh</label>
            <input
              id="ob-birthyear"
              className="form-input"
              type="number"
              placeholder="2000"
              min="1900"
              max={new Date().getFullYear() - 10}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
          </div>
        )}

        {/* Step 3: Height */}
        {step === 3 && (
          <div className="form-group">
            <label className="form-label">Chiều cao (cm)</label>
            <input
              id="ob-height"
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
        )}

        {/* Step 4: Weight */}
        {step === 4 && (
          <div className="form-group">
            <label className="form-label">Cân nặng (kg)</label>
            <input
              id="ob-weight"
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
        )}

        {/* Step 5: Activity */}
        {step === 5 && (
          <div className="activity-list">
            {ACTIVITY_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className={`activity-card${activityLevel === opt.value ? ' selected' : ''}`}
                onClick={() => setActivityLevel(opt.value)}
              >
                <div className="activity-title">{opt.title}</div>
                <div className="activity-desc">{opt.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Step 6: Goal */}
        {step === 6 && (
          <>
            <div className="slider-value">{lossKgPerMonth.toFixed(1)} kg/tháng</div>
            <div className="slider-wrap">
              <input
                id="ob-goal-slider"
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={lossKgPerMonth}
                onChange={(e) => setLossKgPerMonth(parseFloat(e.target.value))}
              />
              <div className="slider-labels">
                <span>0.1 kg</span>
                <span>1.0 kg</span>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div className={`goal-badge ${hint.status}`}>● {hint.label}</div>
              <p style={{ fontSize: '0.85rem' }}>{hint.msg}</p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ marginTop: 32, display: 'flex', gap: 10 }}>
        {step > 1 && (
          <button className="btn btn-ghost" onClick={goBack} style={{ width: 'auto', padding: '14px 20px' }}>
            ←
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            id="ob-next"
            className="btn btn-primary"
            onClick={goNext}
            disabled={!canNext()}
          >
            Tiếp theo
          </button>
        ) : (
          <button
            id="ob-finish"
            className="btn btn-primary"
            onClick={finish}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Đang lưu...
              </>
            ) : 'Bắt đầu ngay 🚀'}
          </button>
        )}
      </div>
    </div>
  );
}
