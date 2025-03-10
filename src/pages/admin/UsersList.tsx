import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import { getUsers, deleteUser } from '../../services/UserService';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { testApiConnection } from '../../utils/apiTest';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ tested: boolean; connected: boolean }>({
    tested: false,
    connected: false
  });

  const checkApiConnection = async () => {
    const result = await testApiConnection();
    setApiStatus({ tested: true, connected: result.success });
    console.log('API connection check:', result.message);
    return result.success;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Check API connection first
      const isConnected = await checkApiConnection();
      if (!isConnected) {
        setError('Cannot connect to the API server. Please make sure the backend is running.');
        setLoading(false);
        return;
      }

      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Error loading users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      try {
        await deleteUser(id);
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError('Error deleting user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchUsers}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors"
            title="Refresh user list"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
          <Link
            to="/admin/users/new"
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add New User
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {!apiStatus.connected && (
            <div className="mt-2">
              <p>Possible solutions:</p>
              <ul className="list-disc pl-5">
                <li>Make sure the backend server is running (npm run dev:backend)</li>
                <li>Check if port 3000 is already in use by another application</li>
                <li>Verify your network connection</li>
              </ul>
              <button
                onClick={checkApiConnection}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Check Connection Again
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 border-b border-gray-200 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/admin/users/edit/${user.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
