import './App.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HabitTrackerFeature from './features/habit-tracker';
import GaussianVisualizerPage from './features/gaussian-visualizer';
import LandingPage from './features/landing/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path='habit-tracker/*' element={<HabitTrackerFeature />} />
        <Route
          path='gaussian-visualizer'
          element={<GaussianVisualizerPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
