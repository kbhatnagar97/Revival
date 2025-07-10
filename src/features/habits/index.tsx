import { Routes, Route } from 'react-router-dom';
import HabitDashboard from './habitDashboard';
// import HabitDetail from './HabitDetail'; // For a future history/details view

const HabitTrackerFeature = () => {
  return (
    <Routes>
      <Route path='/' element={<HabitDashboard />} />
      {/* <Route path=":habitId" element={<HabitDetail />} /> */}
    </Routes>
  );
};

export default HabitTrackerFeature;
