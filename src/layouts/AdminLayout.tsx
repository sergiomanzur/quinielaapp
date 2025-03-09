import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Trophy size={28} className="text-yellow-300" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="mr-2">{user.name}</span>
                <span className="bg-yellow-500 text-xs font-semibold px-2 py-1 rounded-full">
                  ADMIN
                </span>
              </div>
              <Link to="/" className="text-white hover:text-blue-200 transition-colors">
                App
              </Link>
              <button
                onClick={logout}
                className="flex items-center text-white hover:text-red-200 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Admin Sidebar and Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-800 text-white">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/users"
                  className="flex items-center p-3 rounded hover:bg-blue-700 transition-colors"
                >
                  <Users size={18} className="mr-2" />
                  User Management
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
