import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mealsApi } from '../api/meals.js';
import FoodItemRow from '../components/FoodItemRow.jsx';
import { useToast } from '../components/Toast.jsx';

/**
 * Map an AI ingredient (new API shape) → FoodItemRow item shape.
 */
function mapIngredient(ing) {
  return {
    foodName: ing.name,
    portionG: ing.estimated_grams,
    calories: ing.calories,
    proteinG: ing.protein,
    carbsG: ing.carbs,
    fatG: ing.fat,
    fiberG: ing.fiber,
  };
}

function calcTotals(items) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      proteinG: acc.proteinG + (it.proteinG || 0),
      carbsG: acc.carbsG + (it.carbsG || 0),
      fatG: acc.fatG + (it.fatG || 0),
      fiberG: acc.fiberG + (it.fiberG || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
}

export default function MealReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const analysisResult = state?.analysisResult;
  const foodName = analysisResult?.food_name ?? '';
  const confidence = analysisResult?.confidence ?? null;

  const rawIngredients = analysisResult?.ingredients ?? [];
  const initialItems = rawIngredients.length > 0
    ? rawIngredients.map(mapIngredient)
    : [{ foodName: '', portionG: 100, calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }];

  const [items, setItems] = useState(initialItems);
  const [dishName, setDishName] = useState(foodName || '');
  const [description, setDescription] = useState('');
  const [mealDate, setMealDate] = useState(state?.selectedDate || todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totals = calcTotals(items);

  const updateItem = (idx, updated) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? updated : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const confirm = async () => {
    if (items.length === 0) {
      setError('Cần ít nhất 1 món ăn.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const isToday = mealDate === todayISO();
      const eatenAt = isToday
        ? new Date().toISOString()
        : new Date(`${mealDate}T12:00:00+07:00`).toISOString();
      await mealsApi.createMeal({
        description: dishName.trim() || description.trim() || undefined,
        eatenAt,
        items,
      });
      show('Đã lưu bữa ăn! 🎉', 'success');
      navigate('/', { replace: true, state: { selectedDate: mealDate } });
    } catch (err) {
      setError(err.message);
    } finally {
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
        <div className="topbar-title">Xem lại bữa ăn</div>
        <div style={{ width: 40 }} />
      </header>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Dish name — editable */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Tên món ăn</label>
          <input
            id="dish-name"
            className="form-input"
            placeholder="Tên món ăn"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
          />
          {confidence !== null && (
            <div style={{ fontSize: '0.75rem', color: confidence >= 0.75 ? 'var(--accent)' : 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              Độ tin cậy AI: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>

        {/* Date picker */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Ngày ăn</label>
          <input
            id="meal-date"
            type="date"
            className="form-input"
            value={mealDate}
            max={todayISO()}
            onChange={(e) => setMealDate(e.target.value)}
          />
        </div>

        {/* Totals */}
        <div className="totals-card">
          <div className="total-item">
            <div className="tv" style={{ color: 'var(--accent)' }}>{Math.round(totals.calories)}</div>
            <div className="tl">kcal</div>
          </div>
          <div className="total-item">
            <div className="tv" style={{ color: 'var(--protein)' }}>{Math.round(totals.proteinG)}g</div>
            <div className="tl">Chất đạm</div>
          </div>
          <div className="total-item">
            <div className="tv" style={{ color: 'var(--carbs)' }}>{Math.round(totals.carbsG)}g</div>
            <div className="tl">Tinh bột</div>
          </div>
          <div className="total-item">
            <div className="tv" style={{ color: 'var(--fat)' }}>{Math.round(totals.fatG)}g</div>
            <div className="tl">Chất béo</div>
          </div>
          <div className="total-item">
            <div className="tv" style={{ color: 'var(--fiber)' }}>{Math.round(totals.fiberG)}g</div>
            <div className="tl">Chất xơ</div>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 16 }}>Các món ăn ({items.length})</div>

        {items.map((item, idx) => (
          <FoodItemRow
            key={idx}
            item={item}
            index={idx}
            onChange={updateItem}
            onRemove={removeItem}
          />
        ))}

        {/* Add item */}
        <button className="btn btn-ghost" onClick={addItem} style={{ marginBottom: 16 }}>
          + Thêm món
        </button>

        {/* Optional description */}
        <div className="form-group">
          <label className="form-label">Ghi chú bữa ăn (không bắt buộc)</label>
          <input
            id="meal-note"
            className="form-input"
            placeholder="Ví dụ: Bữa trưa tại nhà"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-8">
          <button
            id="confirm-meal"
            className="btn btn-primary"
            onClick={confirm}
            disabled={loading || items.length === 0}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Đang lưu...
              </>
            ) : 'Xác nhận & Lưu bữa ăn ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
