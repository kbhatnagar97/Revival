import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
// Use a default import because HabitProvider.tsx now has a default export.
import HabitProvider from './features/habits/context/HabitProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HabitProvider>
      <App />
    </HabitProvider>
  </React.StrictMode>
);
