import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import type { Habit } from '../../context/habit-context';
import { useHabits } from '../../hooks/useHabits';
import './HabitCard.scss';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HabitCardProps {
  habit: Habit;
  onEdit: () => void;
  selectedDate: Date;
  isSortable: boolean;
  isEditable?: boolean;
}

const IconComponent = ({ iconName }: { iconName: string }) => {
  const Icon = (FaIcons as any)[iconName];
  return Icon ? <Icon /> : <FaIcons.FaStar />;
};

// A simple utility to lighten a hex color for the gradient
const lightenColor = (hex: string, percent: number) => {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.min(255, r + (255 - r) * (percent / 100));
  g = Math.min(255, g + (255 - g) * (percent / 100));
  b = Math.min(255, b + (255 - b) * (percent / 100));

  const toHex = (c: number) => `0${Math.round(c).toString(16)}`.slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onEdit,
  selectedDate,
  isSortable,
  isEditable = true,
}) => {
  const { incrementHabit, decrementHabit } = useHabits();
  const navigate = useNavigate();

  const goalForToday = habit.goal;
  const isBaseGoalCompleted = habit.count >= habit.goal;

  const progressPercentage =
    habit.goal > 0 ? (Math.min(habit.count, habit.goal) / habit.goal) * 100 : 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: habit.id,
    disabled: !isSortable,
  });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardStyle = {
    ...dndStyle,
    '--habit-color': habit.color,
    '--habit-color-light': lightenColor(habit.color, 30),
  } as React.CSSProperties;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleIncrementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementHabit(habit.id, selectedDate);
  };

  const handleDecrementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrementHabit(habit.id, selectedDate);
  };

  const handleCardClick = () => {
    if (isSortable) {
      navigate(`/habit-tracker/${habit.id}`);
    }
  };

  const cardClasses = [
    'habit-card',
    isBaseGoalCompleted ? 'is-completed' : '',
    isDragging ? 'is-dragging' : '',
    !isSortable ? 'is-log-item' : '',
  ].join(' ');

  return (
    <div ref={setNodeRef} style={cardStyle} className={cardClasses}>
      {isSortable && (
        <div className='drag-handle' {...attributes} {...listeners}>
          <FaIcons.FaGripVertical />
        </div>
      )}
      <div
        className='card-content'
        onClick={handleCardClick}
        style={{ cursor: isSortable ? 'pointer' : 'default' }}
        tabIndex={isSortable ? 0 : -1}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && handleCardClick()
        }
      >
        <div className='card-header'>
          <div className='habit-info' title={habit.name}>
            <div
              className='habit-icon'
              style={{ backgroundColor: habit.color }}
            >
              <IconComponent iconName={habit.icon} />
            </div>
            <span className='habit-name'>{habit.name}</span>
          </div>
          <div className='habit-actions'>
            {isEditable && (
              <button
                className='edit-btn hide-on-mobile'
                onClick={handleEditClick}
                aria-label={`Edit ${habit.name}`}
              >
                <FaIcons.FaPen />
              </button>
            )}
            <span className='habit-progress-text'>
              {habit.count} / {goalForToday}
            </span>
            <button
              className='action-btn decrement-btn'
              onClick={handleDecrementClick}
              disabled={habit.count === 0}
              aria-label={`Decrement ${habit.name}`}
            >
              <FaIcons.FaMinus />
            </button>
            <button
              className='action-btn increment-btn'
              onClick={handleIncrementClick}
              aria-label={`Increment ${habit.name}`}
            >
              <FaIcons.FaPlus />
            </button>
          </div>
        </div>
        {habit.goal > 0 && (
          <div className='progress-bar-container'>
            <div
              className='progress-bar-fill'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
