import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './HabitCalendar.scss';
import type { Habit } from '../../context/habit-context';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface HabitCalendarProps {
  habits: Habit[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  singleHabitHistory?: { [date: string]: number };
  singleHabitGoal?: number;
  color?: string;
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({
  habits,
  selectedDate,
  onDateSelect,
  singleHabitHistory,
  singleHabitGoal,
  color,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const completionMap = new Map<string, { goalMet: boolean; color: string }>();

  if (singleHabitHistory && singleHabitGoal) {
    Object.entries(singleHabitHistory).forEach(([date, count]) => {
      if (count >= singleHabitGoal) {
        completionMap.set(date, { goalMet: true, color: color || '#2ecc71' });
      }
    });
  } else {
    habits.forEach((habit) => {
      Object.entries(habit.completionData).forEach(([date, count]) => {
        if (count >= habit.goal) {
          completionMap.set(date, { goalMet: true, color: habit.color });
        }
      });
    });
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = [];
  const startDayOfWeek = firstDayOfMonth.getDay();

  for (let i = 0; i < startDayOfWeek; i++) {
    daysInMonth.push(<div key={`empty-start-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const thisDate = new Date(Date.UTC(year, month, day));
    const dateString = getLocalDateString(new Date(year, month, day));

    const completionInfo = completionMap.get(dateString);
    const isCompleted = !!completionInfo;

    const today = new Date();
    const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
    const isSelected = selectedDate ? dateString === getLocalDateString(selectedDate) : false;

    const dayClasses = ['calendar-day'];
    if (isToday) dayClasses.push('is-today');
    if (isSelected) dayClasses.push('is-selected');
    if (isCompleted) dayClasses.push('is-completed');
    if (onDateSelect) dayClasses.push('is-clickable');

    const DayComponent = onDateSelect ? 'button' : 'div';

    daysInMonth.push(
      <DayComponent
        key={day}
        className={dayClasses.join(' ')}
        onClick={onDateSelect ? () => onDateSelect(new Date(year, month, day)) : undefined}
        aria-label={onDateSelect ? `Select date ${day}` : `Date ${day}`}
      >
        <span className="day-number">{day}</span>
        {isCompleted && <div className="completion-dot" style={{ backgroundColor: completionInfo.color }}></div>}
      </DayComponent>
    );
  }

  const changeMonth = (amount: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  return (
    <div className="habit-calendar">
      <div className="calendar-header">
        <button onClick={() => changeMonth(-1)} aria-label="Previous month">
          <FaChevronLeft />
        </button>
        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => changeMonth(1)} aria-label="Next month">
          <FaChevronRight />
        </button>
      </div>
      <div className="calendar-grid">
        <div className="day-name">Sun</div>
        <div className="day-name">Mon</div>
        <div className="day-name">Tue</div>
        <div className="day-name">Wed</div>
        <div className="day-name">Thu</div>
        <div className="day-name">Fri</div>
        <div className="day-name">Sat</div>
        {daysInMonth}
      </div>
    </div>
  );
};

export default HabitCalendar;