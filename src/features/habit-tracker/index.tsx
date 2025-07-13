import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../common/context/auth-context';
import HabitDashboard from './HabitDashboard';
import HabitDetail from './HabitDetail';
import SimpleHeader from '../../common/components/SimpleHeader/SimpleHeader';
import './index.scss';

const HabitTrackerFeature = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to landing page if user signs out while on tracker
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

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
