import { useState, useMemo } from 'react';
import { useHabits } from './hooks/useHabits';
import type { Habit } from './context/habit-context';
import { FaPlus } from 'react-icons/fa';
import './HabitDashboard.scss';
import HabitCard from './components/HabitCard';
import HabitFormModal from './components/HabitFormModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormattedDate = (): string => {
  const date = new Date();
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const getDaySuffix = (d: string) => {
    if (d.endsWith('1') && !d.endsWith('11')) return 'st';
    if (d.endsWith('2') && !d.endsWith('12')) return 'nd';
    if (d.endsWith('3') && !d.endsWith('13')) return 'rd';
    return 'th';
  };
  return `${weekday}, ${month} ${day}${getDaySuffix(day)}`;
};

const HabitDashboard = () => {
  const { habits, reorderHabits } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todaysHabits = useMemo(() => {
    const today = new Date();
    const todayDayIndex = today.getDay();
    const todayDateString = getLocalDateString(today);

    return habits
      .filter((habit) => habit.days.includes(todayDayIndex))
      .map((habit) => ({
        ...habit,
        count: habit.completionData?.[todayDateString] || 0,
      }));
  }, [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderHabits(String(active.id), String(over.id));
    }
  };

  const handleOpenAddModal = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const habitIds = useMemo(() => todaysHabits.map((h) => h.id), [todaysHabits]);
  const formattedDate = getFormattedDate();

  return (
    <div className="habit-dashboard">
      <div className="dashboard-header">
        <div className="header-title-group">
          <h2>Today's Tasks</h2>
          <p>{formattedDate}</p>
        </div>
        <button className="create-habit-icon-btn" onClick={handleOpenAddModal} aria-label="Create new habit">
          <FaPlus />
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={habitIds} strategy={verticalListSortingStrategy}>
          <div className="habit-list">
            {todaysHabits.length > 0 ? (
              todaysHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  selectedDate={new Date()}
                  onEdit={() => handleOpenEditModal(habit)}
                  isSortable={true}
                  isEditable={true}
                />
              ))
            ) : (
              <div className="no-habits-message">
                <p>No tasks scheduled for today.</p>
                <p>Add a new habit or enjoy your day off!</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isModalOpen && <HabitFormModal habitToEdit={editingHabit} onClose={handleCloseModal} />}
    </div>
  );
};

export default HabitDashboard;