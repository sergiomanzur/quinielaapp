import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuinielaProvider, useQuiniela } from './context/QuinielaContext';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import QuinielaList from './components/QuinielaList';
import QuinielaDetail from './components/QuinielaDetail';
import AuthPage from './components/AuthPage';
import StatsPage from './components/StatsPage';
import NotificationContainer from './components/NotificationContainer';
import { startPeriodicSync, stopPeriodicSync } from './utils/storage';

const QuinielaApp: React.FC = () => {
  const { currentQuiniela } = useQuiniela();
  const [showStats, setShowStats] = useState(false);

  // Function to toggle between main view and stats
  const toggleStats = () => {
    setShowStats(prev => !prev);
  };

  // Reset stats view when selecting a quiniela
  useEffect(() => {
    if (currentQuiniela) {
      setShowStats(false);
    }
  }, [currentQuiniela]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 overflow-hidden w-full">
      <Header onStatsClick={toggleStats} showingStats={showStats} />
      <main className="w-full flex-grow px-2 py-8 sm:px-4">
        <div className="w-full max-w-7xl mx-auto">
          {showStats ? (
            <StatsPage />
          ) : (
            currentQuiniela ? <QuinielaDetail /> : <QuinielaList />
          )}
        </div>
      </main>
      <NotificationContainer />
      <footer className="bg-gray-800 text-white py-4 text-center w-full">
        <p className="text-sm">Quiniela de Fútbol &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-500">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <QuinielaProvider>
      <NotificationProvider>
        <QuinielaApp />
      </NotificationProvider>
    </QuinielaProvider>
  ) : (
    <NotificationProvider>
      <AuthPage />
    </NotificationProvider>
  );
};

// Now the App component doesn't need to wrap with AuthProvider as that's in main.tsx
const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Start and stop periodic syncing with the server when the app loads/unloads
  useEffect(() => {
    startPeriodicSync();

    // Clean up when component unmounts
    return () => {
      stopPeriodicSync();
    };
  }, []);

  // Manage body class when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [menuOpen]);

  return <AuthenticatedApp />;
};

export default App;
