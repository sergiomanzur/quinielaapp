import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuinielaProvider, useQuiniela } from './context/QuinielaContext';
import Header from './components/Header';
import QuinielaList from './components/QuinielaList';
import QuinielaDetail from './components/QuinielaDetail';
import AuthPage from './components/AuthPage';
import { startPeriodicSync, stopPeriodicSync } from './utils/storage';

const QuinielaApp: React.FC = () => {
  const { currentQuiniela } = useQuiniela();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="container mx-auto flex-grow px-4 py-8">
        {currentQuiniela ? <QuinielaDetail /> : <QuinielaList />}
      </main>
      <footer className="bg-gray-800 text-white py-4 text-center">
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
      <QuinielaApp />
    </QuinielaProvider>
  ) : (
    <AuthPage />
  );
};

// Now the App component doesn't need to wrap with AuthProvider as that's in main.tsx
const App: React.FC = () => {
  // Start and stop periodic syncing with the server when the app loads/unloads
  useEffect(() => {
    startPeriodicSync();

    // Clean up when component unmounts
    return () => {
      stopPeriodicSync();
    };
  }, []);

  return <AuthenticatedApp />;
};

export default App;
