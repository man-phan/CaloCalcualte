import { useState, useRef, useCallback } from 'react';

const formatLocalDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getMondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildWeek(offset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = formatLocalDate(today);

  const monday = getMondayOf(today);
  monday.setDate(monday.getDate() + offset * 7);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = formatLocalDate(d);
    days.push({
      iso,
      dayNum: d.getDate(),
      dayLabel: DAY_LABELS[d.getDay()],
      isToday: iso === todayISO,
      isFuture: iso > todayISO,
    });
  }
  return days;
}

export default function LineCalendar({ selectedDate, onSelectDate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  // 'idle' | 'slide-left' | 'slide-right'
  const [animDir, setAnimDir] = useState('idle');
  const animating = useRef(false);

  const days = buildWeek(weekOffset);

  const switchWeek = useCallback((dir) => {
    if (animating.current) return;
    animating.current = true;
    setAnimDir(dir); // kick off slide-out

    setTimeout(() => {
      setWeekOffset((w) => {
        const next = dir === 'slide-left' ? w + 1 : w - 1;
        return dir === 'slide-left' ? Math.min(next, 0) : next;
      });
      setAnimDir(dir === 'slide-left' ? 'enter-right' : 'enter-left');

      // tiny RAF to let React paint the new week, then clear class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimDir('idle');
          animating.current = false;
        });
      });
    }, 180); // matches CSS transition
  }, []);

  // Touch handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);

    // Ignore if more vertical than horizontal (scrolling page)
    if (dy > Math.abs(dx)) return;
    if (Math.abs(dx) < 40) return;

    if (dx > 0) {
      switchWeek('slide-left');  // swipe left → next week
    } else {
      switchWeek('slide-right'); // swipe right → prev week
    }
    touchStartX.current = null;
  };

  const animClass =
    animDir === 'slide-left'  ? ' line-cal-scroll--slide-left'  :
    animDir === 'slide-right' ? ' line-cal-scroll--slide-right' :
    animDir === 'enter-left'  ? ' line-cal-scroll--enter-left'  :
    animDir === 'enter-right' ? ' line-cal-scroll--enter-right' : '';

  return (
    <div
      className="line-cal-wrap"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={'line-cal-scroll' + animClass}>
        {days.map((d) => {
          const isSelected = d.iso === selectedDate;
          return (
            <button
              key={d.iso}
              className={
                'line-cal-day' +
                (isSelected ? ' line-cal-day--selected' : '') +
                (d.isToday && !isSelected ? ' line-cal-day--today' : '') +
                (d.isFuture ? ' line-cal-day--disabled' : '')
              }
              onClick={() => !d.isFuture && onSelectDate(d.iso)}
              disabled={d.isFuture}
              aria-label={d.iso}
              aria-pressed={isSelected}
            >
              <span className="line-cal-dow">{d.dayLabel}</span>
              <span className="line-cal-num">{d.dayNum}</span>
              {isSelected && <span className="line-cal-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
