import './App.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

// Import Pages and Layout
import Layout from './common/components/Layout/Layout';
import HabitTrackerFeature from './features/habits'; // Updated import
import GaussianVisualizerPage from './features/gaussian-visualizer'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="habit-tracker/*" element={<HabitTrackerFeature />} />
          <Route path="gaussian-visualizer" element={<GaussianVisualizerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;