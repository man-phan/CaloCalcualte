import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mealsApi } from '../api/meals.js';

/**
 * Resize an image File to max 1024px on the longest side, JPEG quality 0.82.
 * Returns a Blob ready to append to FormData.
 */
async function resizeImageFile(file, maxPx = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else { width = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

const PhotoTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const isMobile = () => /Mobi|Android|iPhone/i.test(navigator.userAgent);

export default function AddMealPage() {
  const [mode, setMode] = useState(null); // null | 'camera' | 'upload' | 'text' | 'photo-text'
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const selectedDate = navState?.selectedDate || null;

  const handleOption = (opt) => {
    setMode(opt);
    setError('');
    if (opt === 'camera') cameraRef.current?.click();
    if (opt === 'upload') uploadRef.current?.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const canSubmit = () => {
    if (!mode) return false;
    if (mode === 'text') return description.trim().length > 0;
    if (mode === 'camera' || mode === 'upload') return !!imageFile;
    if (mode === 'photo-text') return !!imageFile && description.trim().length > 0;
    return false;
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      if (imageFile) {
        const resized = await resizeImageFile(imageFile);
        formData.append('image', resized, 'photo.jpg');
      }
      if (description.trim()) formData.append('description', description.trim());

      const result = await mealsApi.analyze(formData);
      navigate('/meal-review', { state: { analysisResult: result, selectedDate } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Quay lại">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="topbar-title">Thêm bữa ăn</div>
        <div style={{ width: 40 }} />
      </header>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div className="analyze-loading">
            <div className="spinner" />
            <p>AI đang phân tích bữa ăn...</p>
            <small>Quá trình này có thể mất 5–10 giây</small>
          </div>
        )}

        {!loading && (
          <>
            <div className="section-label">Chọn cách nhập bữa ăn</div>

            {/* Hidden inputs */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />

            <div className="meal-options">
              {isMobile() && (
                <div
                  className={`meal-option-card${mode === 'camera' ? ' selected' : ''}`}
                  style={mode === 'camera' ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
                  onClick={() => handleOption('camera')}
                >
                  <CameraIcon />
                  Chụp ảnh
                </div>
              )}
              <div
                className={`meal-option-card${mode === 'upload' ? ' selected' : ''}`}
                style={mode === 'upload' ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
                onClick={() => handleOption('upload')}
              >
                <UploadIcon />
                Tải ảnh lên
              </div>
              <div
                className={`meal-option-card${mode === 'text' ? ' selected' : ''}`}
                style={mode === 'text' ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
                onClick={() => { setMode('text'); setImageFile(null); }}
              >
                <TextIcon />
                Mô tả món ăn
              </div>
              <div
                className={`meal-option-card${mode === 'photo-text' ? ' selected' : ''}`}
                style={mode === 'photo-text' ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' } : {}}
                onClick={() => { setMode('photo-text'); uploadRef.current?.click(); }}
              >
                <PhotoTextIcon />
                Ảnh + Mô tả
              </div>
            </div>

            {/* Image preview */}
            {imageFile && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Ảnh đã chọn"
                  style={{ width: '100%', borderRadius: 12, maxHeight: 220, objectFit: 'cover', border: '1px solid var(--border)' }}
                />
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 8, fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => setImageFile(null)}
                >
                  Xoá ảnh
                </button>
              </div>
            )}

            {/* Description textarea */}
            {(mode === 'text' || mode === 'photo-text') && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Mô tả món ăn</label>
                <textarea
                  id="meal-description"
                  className="form-input"
                  style={{ minHeight: 100, resize: 'vertical' }}
                  placeholder="Ví dụ: Cơm trắng 1 chén, 2 miếng thịt kho, rau muống xào..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            {mode && (
              <div style={{ marginTop: 20 }}>
                <button
                  id="analyze-submit"
                  className="btn btn-primary"
                  onClick={submit}
                  disabled={!canSubmit()}
                >
                  Phân tích bữa ăn ✨
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
