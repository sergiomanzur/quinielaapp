import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import AdminLayout from '../layouts/AdminLayout';
import UsersList from '../pages/admin/UsersList';
import UserForm from '../pages/admin/UserForm';
import AdminRoute from '../components/AdminRoute';
import { useAuth } from '../context/AuthContext';

const Router = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Main app route */}
        <Route path="/" element={<App />} />

        {/* Protected admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UsersList />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/edit/:id" element={<UserForm />} />
          </Route>
        </Route>

        {/* Catch all - redirect to main app */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
