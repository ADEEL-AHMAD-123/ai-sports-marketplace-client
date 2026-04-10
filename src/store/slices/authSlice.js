// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { CREDITS_FREE_ON_SIGNUP } from '@/constants/app';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,       // { id, name, email, role, credits, isEmailVerified }
    token: null,
    isLoggedIn: false,
  },
  reducers: {
    loginSuccess(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      state.isLoggedIn = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
    },
    updateCredits(state, { payload }) {
      if (state.user) state.user.credits = payload;
    },
    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload };
    },
  },
});

export const { loginSuccess, logout, updateCredits, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser       = (s) => s.auth.user;
export const selectToken      = (s) => s.auth.token;
export const selectIsLoggedIn = (s) => s.auth.isLoggedIn;
export const selectCredits    = (s) => s.auth.user?.credits ?? 0;
export const selectIsAdmin    = (s) => s.auth.user?.role === 'admin';