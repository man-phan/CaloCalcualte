import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.js';
import { mealsApi } from '../api/meals.js';
import BottomNav from '../components/BottomNav.jsx';
import NutritionBar from '../components/NutritionBar.jsx';
import LineCalendar from '../components/LineCalendar.jsx';
import { useToast } from '../components/Toast.jsx';

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CalorieRing({ target, consumed }) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);
  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="calorie-ring-wrap">
      <div className="ring-wrap">
        <svg className="ring-svg" width="180" height="180" viewBox="0 0 180 180">
          <circle className="ring-track" cx="90" cy="90" r={RADIUS} />
          <circle
            className="ring-fill"
            cx="90"
            cy="90"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="ring-center" style={{ position: 'absolute' }}>
          <span className="ring-kcal">{Math.round(remaining)}</span>
          <span className="ring-label">kcal còn lại</span>
        </div>
      </div>

      <div className="calorie-row">
        <div className="calorie-stat">
          <div className="val">{Math.round(target)}</div>
          <div className="lbl">Mục tiêu</div>
        </div>
        <div className="calorie-stat consumed">
          <div className="val">{Math.round(consumed)}</div>
          <div className="lbl">Đã ăn</div>
        </div>
        <div className="calorie-stat remaining">
          <div className="val">{Math.round(remaining)}</div>
          <div className="lbl">Còn lại</div>
        </div>
      </div>
    </div>
  );
}

function HomeMealSheet({ meal, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [copyMeal, setCopyMeal] = useState(null);
  const [copyDate, setCopyDate] = useState(todayISO());
  const [copying, setCopying] = useState(false);
  const { show } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mealsApi.deleteMeal(meal.id);
      onDelete(meal.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyOk = async () => {
    if (!copyMeal || !copyDate) return;
    if (copyDate > todayISO()) {
      show('Không thể dán vào ngày tương lai.', 'error');
      return;
    }
    setCopying(true);
    try {
      const eatenAt = `${copyDate}T12:00:00+07:00`;
      await mealsApi.createMeal({
        description: copyMeal.description || title,
        eatenAt,
        items: copyMeal.items.map((it) => ({
          foodName: it.foodName,
          portionG: it.portionG ?? 0,
          calories: it.calories ?? 0,
          proteinG: it.proteinG ?? 0,
          carbsG: it.carbsG ?? 0,
          fatG: it.fatG ?? 0,
          fiberG: it.fiberG ?? 0,
        })),
      });
      show(`Đã dán "${title}" vào ${copyDate}`, 'success');
      setCopyMeal(null);
    } catch (err) {
      show(err.message || 'Lỗi khi sao chép bữa ăn.', 'error');
    } finally {
      setCopying(false);
    }
  };

  const title = meal.description || meal.items?.map(it => it.foodName).filter(Boolean).join(', ') || 'Bữa ăn';

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="sheet-title" style={{ margin: 0 }}>{title}</div>
          <button
            onClick={() => { setCopyMeal(meal); setCopyDate(todayISO()); }}
            style={{ background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8, color: 'var(--text-dim)', flexShrink: 0, whiteSpace: 'nowrap' }}
          >Sao chép</button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Calo', val: `${Math.round(meal.calories ?? 0)} kcal`, color: 'var(--accent)' },
            { label: 'Chất đạm', val: `${Math.round(meal.proteinG ?? 0)}g`, color: 'var(--protein)' },
            { label: 'Tinh bột', val: `${Math.round(meal.carbsG ?? 0)}g`, color: 'var(--carbs)' },
            { label: 'Chất béo', val: `${Math.round(meal.fatG ?? 0)}g`, color: 'var(--fat)' },
            { label: 'Chất xơ', val: `${Math.round(meal.fiberG ?? 0)}g`, color: 'var(--fiber)' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: '0.95rem' }}>{s.val}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Thành phần label */}
        {meal.items?.length > 0 && (
          <div className="section-label" style={{ marginBottom: 8 }}>Thành phần</div>
        )}

        {meal.items?.map((item, i) => {
          const p = item.proteinG ?? 0;
          const c = item.carbsG ?? 0;
          const f = item.fatG ?? 0;
          const x = item.fiberG ?? 0;
          const total = p + c + f + x || 1;
          const isExpanded = expandedItem === i;
          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-card2)',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => setExpandedItem(isExpanded ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.foodName || 'Món ăn'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {item.portionG ?? 0}g
                    {item.calories ? ` • ${Math.round(item.calories)} kcal` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.88rem' }}>{Math.round(item.calories ?? 0)} kcal</div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
                </div>
              </div>

              {/* Compact macro bar always visible */}
              <div className="meal-macro-bar" style={{ width: '100%', marginTop: 0 }}>
                <div className="meal-macro-seg seg-carbs"  style={{ width: `${(c/total)*100}%` }} />
                <div className="meal-macro-seg seg-protein" style={{ width: `${(p/total)*100}%` }} />
                <div className="meal-macro-seg seg-fat"     style={{ width: `${(f/total)*100}%` }} />
                <div className="meal-macro-seg seg-fiber"   style={{ width: `${(x/total)*100}%` }} />
              </div>

              {/* Expanded detail: NutritionBar progress bars */}
              {isExpanded && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--bg-card)', paddingTop: 12 }}>
                  <NutritionBar name="Tinh bột"  consumed={c} target={total} unit="g" colorKey="carbs"   />
                  <NutritionBar name="Chất đạm"  consumed={p} target={total} unit="g" colorKey="protein" />
                  <NutritionBar name="Chất béo"  consumed={f} target={total} unit="g" colorKey="fat"     />
                  <NutritionBar name="Chất xơ"   consumed={x} target={total} unit="g" colorKey="fiber"   />
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xoá...' : '🗑 Xoá bữa ăn này'}
          </button>
        </div>
      </div>

      {/* Copy Meal Modal */}
      {copyMeal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }}
            onClick={() => setCopyMeal(null)}
          />
          <div style={{
            position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            background: 'var(--bg-card)', borderRadius: 16, padding: '24px 20px',
            zIndex: 201, width: 'min(320px, 90vw)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>📋 Sao chép bữa ăn</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 16 }}>
              "{title}" — {Math.round(meal.calories ?? 0)} kcal
            </div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Chọn ngày dán:</label>
            <input
              type="date"
              value={copyDate}
              max={todayISO()}
              onChange={(e) => setCopyDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--bg-card2)',
                background: 'var(--bg-card2)', color: 'var(--text)', fontSize: '0.95rem',
                marginBottom: 20, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn"
                style={{ flex: 1, background: 'var(--bg-card2)', color: 'var(--text)' }}
                onClick={() => setCopyMeal(null)}
              >Huỷ</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={copying}
                onClick={handleCopyOk}
              >{copying ? 'Đang dán...' : 'OK'}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(() => location.state?.selectedDate || todayISO());
  const [selectedMeal, setSelectedMeal] = useState(null);
  const navigate = useNavigate();
  const { show } = useToast();

  const load = async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getToday(date);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const isToday = selectedDate === todayISO();

  const goal = data?.goal;
  const consumed = data?.consumed;

  const macros = goal ? [
    { name: 'Tinh bột',   consumed: consumed?.carbsG ?? 0,    target: goal.carbsG ?? 0,   unit: 'g', colorKey: 'carbs'   },
    { name: 'Chất đạm',   consumed: consumed?.proteinG ?? 0,  target: goal.proteinG ?? 0, unit: 'g', colorKey: 'protein' },
    { name: 'Chất béo',   consumed: consumed?.fatG ?? 0,      target: goal.fatG ?? 0,     unit: 'g', colorKey: 'fat'     },
    { name: 'Chất xơ',    consumed: consumed?.fiberG ?? 0,    target: goal.fiberG ?? 0,   unit: 'g', colorKey: 'fiber'   },
  ] : [];

  // Format selected date for display (e.g. "16/09")
  const [y, m, dd] = selectedDate.split('-');
  const dateLabel = isToday ? 'hôm nay' : `${dd}/${m}/${y}`;

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-brand">
          <span>CC</span> Calo Calculate
        </div>
        <button className="icon-btn" onClick={() => load(selectedDate)} aria-label="Làm mới">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>
      </header>

      {/* Line Calendar */}
      <LineCalendar selectedDate={selectedDate} onSelectDate={handleDateSelect} />

      <div className="page-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Đang tải...</span>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error">{error}</div>
        )}

        {!loading && data && (
          <>
            {data.warning && (
              <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                ⚠️ {data.warning}
              </div>
            )}

            {/* Calorie ring */}
            <div className="card">
              <CalorieRing
                target={goal?.calories ?? 0}
                consumed={consumed?.calories ?? 0}
              />
            </div>

            {/* Macro bars */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>
                Dinh dưỡng {dateLabel}
              </div>
              {macros.map((m) => (
                <NutritionBar key={m.name} {...m} />
              ))}
            </div>

            {/* Meals summary */}
            {data.meals?.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>
                  Bữa ăn {dateLabel}
                </div>
                {data.meals.map((meal) => (
                  <div key={meal.id} className="meal-card" onClick={() => setSelectedMeal(meal)}>
                    <div className="meal-card-header">
                      <span className="meal-card-title">
                        {meal.description || meal.items?.map(it => it.foodName).filter(Boolean).join(', ') || 'Bữa ăn'}
                      </span>
                      <span className="meal-card-kcal">{Math.round(meal.calories ?? 0)} kcal</span>
                    </div>
                    <div className="meal-macro-bar-wrap">
                      {(() => {
                        const p = meal.proteinG ?? 0;
                        const c = meal.carbsG ?? 0;
                        const f = meal.fatG ?? 0;
                        const x = meal.fiberG ?? 0;
                        const total = p + c + f + x || 1;
                        return (
                          <>
                            <div className="meal-macro-bar">
                              <div className="meal-macro-seg seg-carbs"  style={{ width: `${(c/total)*100}%` }} />
                              <div className="meal-macro-seg seg-protein" style={{ width: `${(p/total)*100}%` }} />
                              <div className="meal-macro-seg seg-fat"     style={{ width: `${(f/total)*100}%` }} />
                              <div className="meal-macro-seg seg-fiber"   style={{ width: `${(x/total)*100}%` }} />
                            </div>
                            <div className="meal-macro-legend">
                              <span className="legend-dot dot-carbs" />Tinh bột <b>{Math.round(c)}g</b>
                              <span className="legend-dot dot-protein" />Chất đạm <b>{Math.round(p)}g</b>
                              <span className="legend-dot dot-fat" />Chất béo <b>{Math.round(f)}g</b>
                              <span className="legend-dot dot-fiber" />Chất xơ <b>{Math.round(x)}g</b>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.meals?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍽️</div>
                <p>{isToday ? 'Chưa có bữa ăn nào hôm nay.' : `Không có bữa ăn nào vào ${dateLabel}.`}</p>
                <p style={{ fontSize: '0.82rem' }}>Nhấn + để thêm bữa ăn!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB — show on today and past days */}
      {selectedDate <= todayISO() && (
        <button className="fab" onClick={() => navigate('/add-meal', { state: { selectedDate } })} aria-label="Thêm bữa ăn">
          +
        </button>
      )}

      {selectedMeal && (
        <HomeMealSheet
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onDelete={(id) => {
            show('Đã xoá bữa ăn', 'success');
            setSelectedMeal(null);
            load(selectedDate);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
