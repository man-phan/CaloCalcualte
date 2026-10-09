const COLOR_MAP = {
  protein: 'var(--protein)',
  carbs: 'var(--carbs)',
  fat: 'var(--fat)',
  fiber: 'var(--fiber)',
  calories: 'var(--accent)',
};

export default function NutritionBar({ name, consumed, target, unit = 'g', colorKey = 'accent' }) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const color = COLOR_MAP[colorKey] || 'var(--accent)';
  const over = consumed > target;

  return (
    <div className="nutrition-bar-item">
      <div className="nutrition-bar-header">
        <span className="nutrition-bar-name">{name}</span>
        <span className="nutrition-bar-values">
          <strong style={{ color: over ? 'var(--danger)' : undefined }}>
            {Math.round(consumed)}{unit}
          </strong>
          {' / '}
          {Math.round(target)}{unit}
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: over ? 'var(--danger)' : color,
          }}
        />
      </div>
    </div>
  );
}
