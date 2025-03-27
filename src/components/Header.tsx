import React from 'react';
import { Trophy, LogOut, User, Settings, BarChart2, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onStatsClick: () => void;
  showingStats: boolean;
}

const Header: React.FC<HeaderProps> = ({ onStatsClick, showingStats }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy size={28} className="text-yellow-300" />
          <h1 className="text-2xl font-bold">Quiniela de Fútbol</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onStatsClick}
            className="text-white hover:bg-green-700 px-3 py-2 rounded transition-colors flex items-center"
          >
            {showingStats ? (
              <>
                <Home size={18} className="mr-2" />
                <span>Inicio</span>
              </>
            ) : (
              <>
                <BarChart2 size={18} className="mr-2" />
                <span>Estadísticas</span>
              </>
            )}
          </button>

          {user && (
            <>
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="flex items-center text-white hover:text-yellow-200 transition-colors"
                >
                  <Settings size={18} className="mr-1" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center">
                <User size={18} className="mr-2" />
                <span className="mr-2">{user.name}</span>
                {isAdmin() && (
                  <span className="bg-yellow-500 text-xs font-semibold px-2 py-1 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="flex items-center text-white hover:text-red-200 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
