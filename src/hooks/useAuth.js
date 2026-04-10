// hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSuccess, logout as logoutAction, selectUser, selectIsLoggedIn, selectCredits, selectIsAdmin } from '@/store/slices/authSlice';
import { authAPI, getErrorMsg } from '@/services/api';

export function useAuth() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const credits    = useSelector(selectCredits);
  const isAdmin    = useSelector(selectIsAdmin);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    dispatch(loginSuccess(res.data));
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    dispatch(loginSuccess(res.data));
    return res.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    dispatch(logoutAction());
    navigate('/');
    toast('Logged out');
  };

  return { user, isLoggedIn, credits, isAdmin, login, register, logout };
}