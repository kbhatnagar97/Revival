import './App.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HabitTrackerFeature from './features/habit-tracker';
import GaussianVisualizerPage from './features/gaussian-visualizer';
import LandingPage from './features/landing/LandingPage';
import AuthProvider from './common/context/AuthProvider';
import ProtectedRoute from './common/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<LandingPage />} />
          <Route
            path='habit-tracker/*'
            element={
              <ProtectedRoute>
                <HabitTrackerFeature />
              </ProtectedRoute>
            }
          />
          <Route
            path='gaussian-visualizer'
            element={<GaussianVisualizerPage />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
