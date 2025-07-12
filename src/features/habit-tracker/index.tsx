import { Routes, Route } from 'react-router-dom';
import HabitDashboard from './HabitDashboard';
import HabitDetail from './HabitDetail';
import SimpleHeader from '../../common/components/SimpleHeader/SimpleHeader';
import './index.scss';

const HabitTrackerFeature = () => {
  return (
    <div className='habit-tracker-page'>
      <SimpleHeader title='Habit Tracker' />
      <div className='habit-tracker-content'>
        <Routes>
          <Route path='/' element={<HabitDashboard />} />
          <Route path=':habitId' element={<HabitDetail />} />
        </Routes>
      </div>
    </div>
  );
};

export default HabitTrackerFeature;
