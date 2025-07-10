import { Routes, Route } from 'react-router-dom';
import HabitDashboard from './HabitDashboard';
import HabitDetail from './HabitDetail';

const HabitTrackerFeature = () => {
  return (
    <Routes>
      <Route path="/" element={<HabitDashboard />} />
      <Route path=":habitId" element={<HabitDetail />} />
    </Routes>
  );
};

export default HabitTrackerFeature;