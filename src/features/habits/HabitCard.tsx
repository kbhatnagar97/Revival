import React from 'react';
import * as FaIcons from 'react-icons/fa';
import { type Habit, useHabits } from './UseHabits';

interface HabitCardProps {
  habit: Habit;
}

const IconComponent = ({ iconName }: { iconName: string }) => {
  const Icon = (FaIcons as any)[iconName];
  return Icon ? <Icon /> : <FaIcons.FaStar />;
};

const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { incrementHabit } = useHabits();
  const isCompleted = habit.count >= habit.goal;
  const progressPercentage = habit.goal > 0 ? (habit.count / habit.goal) * 100 : 0;

  return (
    <div className={`habit-card ${isCompleted ? 'is-completed' : ''}`}>
      <div className="habit-info">
        <div className="habit-icon" style={{ backgroundColor: habit.color }}>
          <IconComponent iconName={habit.icon} />
        </div>
        <span className="habit-name">{habit.name}</span>
      </div>
      <div className="habit-actions">
        <span className="habit-progress-text">{habit.count} / {habit.goal}</span>
        <button
          className="increment-btn"
          onClick={() => incrementHabit(habit.id)}
          disabled={isCompleted}
          aria-label={`Increment ${habit.name}`}
        >
          <FaIcons.FaPlus />
        </button>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%`, backgroundColor: habit.color }}
        />
      </div>
    </div>
  );
};

export default HabitCard;