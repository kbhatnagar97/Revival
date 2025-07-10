import React from 'react';
import { useHabits } from './UseHabits';
import HabitCard from './habitCard';
import { FaPlus } from 'react-icons/fa';
import './HabitDashboard.scss';

const HabitDashboard = () => {
  const { habits, addHabit } = useHabits();

  const handleAddHabit = () => {
    addHabit({
      name: 'New Habit',
      icon: 'FaSmile',
      color: '#f39c12',
      goal: 1,
    });
  };

  return (
    <div className='habit-dashboard'>
      <div className='dashboard-header'>
        <h2>Today's Habits</h2>
        <button className='add-habit-btn' onClick={handleAddHabit}>
          <FaPlus /> Add Habit
        </button>
      </div>

      {habits.length > 0 ? (
        <div className='habit-list'>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      ) : (
        <div className='no-habits-message'>
          <p>Your journey to better habits starts here.</p>
          <p>Click "Add Habit" to create your first goal!</p>
        </div>
      )}
    </div>
  );
};

export default HabitDashboard;
