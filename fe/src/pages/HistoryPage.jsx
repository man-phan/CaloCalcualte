import { useState, useEffect } from 'react';
import { mealsApi } from '../api/meals.js';
import BottomNav from '../components/BottomNav.jsx';
import { useToast } from '../components/Toast.jsx';
import NutritionBar from '../components/NutritionBar.jsx';

function formatDate(isoStr) {
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(meals) {
  const map = {};
  for (const meal of meals) {
    const key = new Date(meal.eatenAt || meal.createdAt).toDateString();
    if (!map[key]) map[key] = { label: formatDate(meal.eatenAt || meal.createdAt), meals: [] };
    map[key].meals.push(meal);
  }
  return Object.values(map);
}

function MealSheet({ meal, onClose, onDelete }) {
  const { show } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [copyMeal, setCopyMeal] = useState(null);
  const [copyDate, setCopyDate] = useState(todayISO());
  const [copying, setCopying] = useState(false);

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const title = meal.description || meal.items?.map(it => it.foodName).filter(Boolean).join(', ') || 'Bữa ăn';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mealsApi.deleteMeal(meal.id);
      show('Đã xoá bữa ăn', 'success');
      onDelete(meal.id);
      onClose();
    } catch (err) {
      show(err.message, 'error');
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

        {/* Totals row */}
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

        {/* Items list */}
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

export default function HistoryPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await mealsApi.getMeals();
      setMeals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const groups = groupByDate(meals);

  const handleDelete = (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span>CC</span> Lịch sử
        </div>
        <button className="icon-btn" onClick={load} aria-label="Làm mới">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>
      </header>

      <div className="page-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Đang tải...</span>
          </div>
        )}

        {!loading && error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && meals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <p>Chưa có bữa ăn nào được ghi lại.</p>
          </div>
        )}

        {!loading && groups.map((group) => (
          <div key={group.label} className="date-section">
            <div className="date-header">{group.label}</div>
            {group.meals.map((meal) => (
              <div
                key={meal.id}
                className="meal-card"
                onClick={() => setSelected(meal)}
              >
                <div className="meal-card-header">
                  <span className="meal-card-title">
                    {meal.description || meal.items?.map(it => it.foodName).filter(Boolean).join(', ') || 'Bữa ăn'}
                  </span>
                  <span className="meal-card-kcal">{Math.round(meal.calories ?? 0)} kcal</span>
                </div>
                <div className="meal-card-macros">
                  <span className="macro-chip">P: <span>{Math.round(meal.proteinG ?? 0)}g</span></span>
                  <span className="macro-chip">C: <span>{Math.round(meal.carbsG ?? 0)}g</span></span>
                  <span className="macro-chip">F: <span>{Math.round(meal.fatG ?? 0)}g</span></span>
                  <span className="macro-chip">Xơ: <span>{Math.round(meal.fiberG ?? 0)}g</span></span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {selected && (
        <MealSheet
          meal={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}

      <BottomNav />
    </div>
  );
}
