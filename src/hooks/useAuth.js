// src/hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  loginUser, registerUser, logoutUser,
  selectUser, selectIsLoggedIn, selectCredits,
  selectIsAdmin, selectAuthLoading, selectAuthError,
  clearAuthError, resetAuth,
} from '@/store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user      = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const credits   = useSelector(selectCredits);
  const isAdmin   = useSelector(selectIsAdmin);
  const isLoading = useSelector(selectAuthLoading);
  const error     = useSelector(selectAuthError);

  const login = async (email, password) => {
    const result = await dispatch(loginUser({ data: { email, password } }));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      return { success: true };
    } else {
      return { success: false, error: result.payload?.message };
    }
  };

  const register = async (name, email, password) => {
    const result = await dispatch(registerUser({ data: { name, email, password } }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! You have 3 free credits.');
      return { success: true };
    } else {
      return { success: false, error: result.payload?.message };
    }
  };

  const logout = async () => {
    await dispatch(logoutUser());
    dispatch(resetAuth());
    navigate('/');
    toast('Logged out successfully.');
  };

  const clearError = () => dispatch(clearAuthError());

  return {
    user, isLoggedIn, credits, isAdmin, isLoading, error,
    login, register, logout, clearError,
  };
}