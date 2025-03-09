import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User } from '../../types';
import { getUserById, createUser, updateUser } from '../../services/UserService';
import { ArrowLeft } from 'lucide-react';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined;

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user'
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (isEditMode && id) {
        try {
          setLoading(true);
          const user = await getUserById(id);
          setFormData({
            name: user.name,
            email: user.email,
            role: user.role
          });
        } catch (error) {
          setError('Failed to load user details. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    loadUser();
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email) {
      setError('Name and email are required.');
      return;
    }

    if (!isEditMode && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!isEditMode && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (isEditMode && id) {
        await updateUser(id, formData);
        setSuccess('User updated successfully!');
      } else {
        await createUser({
          name: formData.name!,
          email: formData.email!,
          password: password,
          role: formData.role as 'user' | 'admin'
        });
        setSuccess('User created successfully!');
      }

      // Navigate back after a short delay
      setTimeout(() => navigate('/admin/users'), 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit User' : 'Create User'}</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {!isEditMode && (
          <>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEditMode}
                minLength={6}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEditMode}
              />
            </div>
          </>
        )}

        <div className="mb-6">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role || 'user'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-between">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : isEditMode ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
