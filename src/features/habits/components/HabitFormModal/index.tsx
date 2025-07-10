import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as FaIcons from 'react-icons/fa';
import type { Habit } from '../../context/habit-context';
import { useHabits } from '../../hooks/useHabits';
import './HabitFormModal.scss';

interface HabitFormModalProps {
  habitToEdit: Habit | null;
  onClose: () => void;
}

const PRESET_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const PRESET_ICONS = [
  'FaBed', 'FaBookOpen', 'FaDumbbell', 'FaAppleAlt', 'FaSeedling', 
  'FaMugHot', 'FaGlassWhiskey', 'FaCode', 'FaPencilAlt', 'FaMusic',
  'FaRunning', 'FaPaintBrush'
];
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NAME_MAX_LENGTH = 35;

const HabitFormModal: React.FC<HabitFormModalProps> = ({ habitToEdit, onClose }) => {
  const { addHabit, updateHabit, deleteHabit } = useHabits();
  const [formData, setFormData] = useState({
    name: habitToEdit?.name || '',
    goal: habitToEdit?.goal || 1,
    icon: habitToEdit?.icon || 'FaStar',
    color: habitToEdit?.color || '#3498db',
    days: habitToEdit?.days || [0, 1, 2, 3, 4, 5, 6],
  });
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name' && value.length > NAME_MAX_LENGTH) return;
    const numericValue = ['goal'].includes(name) ? parseInt(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => {
      const newDays = prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex];
      return { ...prev, days: newDays };
    });
  };

  const handleSelect = (key: 'icon' | 'color', value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, goal, icon, color, days } = formData;
    
    if (habitToEdit) {
      updateHabit(habitToEdit.id, {
        name, goal, count: habitToEdit.count, icon, color, days,
        debt: 0,
        surplus: 0
      });
    } else {
      addHabit({ name, goal, icon, color, days });
    }
    handleClose();
  };

  const handleDelete = () => {
    if (habitToEdit && window.confirm(`Are you sure you want to delete "${habitToEdit.name}"?`)) {
      deleteHabit(habitToEdit.id);
      handleClose();
    }
  };

  return createPortal(
    <div className={`modal-overlay ${isClosing ? 'is-closing' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{habitToEdit ? 'Edit Habit' : 'Add New Habit'}</h2>
            <button type="button" className="close-btn" onClick={handleClose} aria-label="Close modal">×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <div className="label-wrapper">
                <label htmlFor="name">Habit Name</label>
                <span className="char-counter">{formData.name.length} / {NAME_MAX_LENGTH}</span>
              </div>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} maxLength={NAME_MAX_LENGTH} required placeholder="e.g., Drink Water" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="goal">Daily Goal</label>
                <input type="number" id="goal" name="goal" value={formData.goal} onChange={handleChange} required min="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Scheduled Days</label>
              <div className="picker-container">
                {WEEK_DAYS.map((day, index) => (
                  <button type="button" key={index} className={`picker-item day-picker ${formData.days.includes(index) ? 'selected' : ''}`} onClick={() => handleDayToggle(index)}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Icon</label>
              <div className="picker-container">
                {PRESET_ICONS.map(iconName => (
                  <button type="button" key={iconName} className={`picker-item icon-picker ${formData.icon === iconName ? 'selected' : ''}`} onClick={() => handleSelect('icon', iconName)}>
                    {(FaIcons as any)[iconName]()}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="picker-container">
                {PRESET_COLORS.map(color => (
                  <button type="button" key={color} className={`picker-item color-picker ${formData.color === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => handleSelect('color', color)}>
                    {formData.color === color && <FaIcons.FaCheck />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {habitToEdit && <button type="button" className="btn-delete" onClick={handleDelete}>Delete</button>}
            <button type="button" className="btn-cancel" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Changes</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default HabitFormModal;