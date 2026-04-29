// src/components/auth/RequireAdmin.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsLoggedIn } from '@/store/slices/authSlice';

export default function RequireAdmin({ children }) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user       = useSelector(s => s.auth.user);
  if (!isLoggedIn || user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}