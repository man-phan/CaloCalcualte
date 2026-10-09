const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export default function FoodItemRow({ item, index, onChange, onRemove }) {
  const update = (field, value) => {
    const parsed = field === 'foodName' ? value : parseFloat(value) || 0;
    onChange(index, { ...item, [field]: parsed });
  };

  const fields = [
    { key: 'portionG',  label: 'Khẩu phần (g)' },
    { key: 'calories',  label: 'Kcal' },
    { key: 'proteinG',  label: 'Chất đạm (g)' },
    { key: 'carbsG',    label: 'Tinh bột (g)' },
    { key: 'fatG',      label: 'Chất béo (g)' },
    { key: 'fiberG',    label: 'Chất xơ (g)' },
  ];

  return (
    <div className="food-item-row">
      <div className="food-item-name-row">
        <input
          className="food-item-name-input"
          value={item.foodName}
          onChange={(e) => update('foodName', e.target.value)}
          placeholder="Tên món ăn"
        />
        <button className="delete-btn" onClick={() => onRemove(index)} aria-label="Xoá món">
          <TrashIcon />
        </button>
      </div>
      <div className="food-item-fields">
        {fields.map(({ key, label }) => (
          <div className="mini-field" key={key}>
            <span className="mini-label">{label}</span>
            <input
              className="mini-input"
              type="number"
              min="0"
              step="0.1"
              value={item[key] ?? 0}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
