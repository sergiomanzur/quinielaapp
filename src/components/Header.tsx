import React, { useState } from 'react';
import { Trophy, LogOut, User, Settings, BarChart2, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onStatsClick: () => void;
  showingStats: boolean;
}

const Header: React.FC<HeaderProps> = ({ onStatsClick, showingStats }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-md relative z-20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy size={28} className="text-yellow-300" />
          <h1 className="text-2xl font-bold">Quiniela de Fútbol</h1>
        </div>

        {/* Hamburger menu button (visible on small screens) */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop menu (hidden on small screens) */}
        <div className="hidden md:flex items-center space-x-4">
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

      {/* Mobile menu side panel */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      ></div>

      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-green-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-green-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Menú</h2>
          <button 
            onClick={closeMobileMenu}
            className="text-white"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-4 py-6 flex flex-col space-y-4">
          <button
            onClick={() => { onStatsClick(); closeMobileMenu(); }}
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
              <div className="flex items-center py-2">
                <User size={18} className="mr-2" />
                <span className="mr-2">{user.name}</span>
                {isAdmin() && (
                  <span className="ml-2 bg-yellow-500 text-xs font-semibold px-2 py-1 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="flex items-center text-white hover:bg-green-700 px-3 py-2 rounded transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Settings size={18} className="mr-2" />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={() => { logout(); closeMobileMenu(); }}
                className="flex items-center text-white hover:bg-green-700 px-3 py-2 rounded transition-colors w-full"
              >
                <LogOut size={18} className="mr-2" />
                <span>Cerrar sesión</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
