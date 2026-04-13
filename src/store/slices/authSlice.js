// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createApiThunk } from '@/utils/apiHelper';

// ── API Thunks ────────────────────────────────────────────────

export const registerUser = createApiThunk({
  typePrefix: 'auth/register',
  method: 'POST',
  url: '/auth/register',
});

export const loginUser = createApiThunk({
  typePrefix: 'auth/login',
  method: 'POST',
  url: '/auth/login',
});

export const logoutUser = createApiThunk({
  typePrefix: 'auth/logout',
  method: 'POST',
  url: '/auth/logout',
});

export const getLoggedInUser = createApiThunk({
  typePrefix: 'auth/getMe',
  method: 'GET',
  url: '/auth/me',
});

export const forgotPassword = createApiThunk({
  typePrefix: 'auth/forgotPassword',
  method: 'POST',
  url: '/auth/forgot-password',
});

export const resetPassword = createApiThunk({
  typePrefix: 'auth/resetPassword',
  method: 'POST',
  url: '/auth/reset-password',
});

export const updatePassword = createApiThunk({
  typePrefix: 'auth/updatePassword',
  method: 'PUT',
  url: '/auth/update-password',
});

// ── Slice ─────────────────────────────────────────────────────

const initialState = {
  user:        null,
  token:       null,
  isLoggedIn:  false,
  isLoading:   false,
  error:       null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Used for direct token updates (e.g. after Stripe redirect)
    setCredits(state, { payload }) {
      if (state.user) state.user.credits = payload;
    },
    // Manually patch user fields without a full re-fetch
    patchUser(state, { payload }) {
      if (state.user) state.user = { ...state.user, ...payload };
    },
    clearAuthError(state) {
      state.error = null;
    },
    resetAuth: () => initialState,
  },

  extraReducers: (builder) => {
    // ── Helper to set loading/error across all thunks ──────────
    const pending   = (state) => { state.isLoading = true;  state.error = null; };
    const rejected  = (state, { payload }) => {
      state.isLoading = false;
      state.error = payload?.message || 'Something went wrong';
    };

    builder
      // ── Register ─────────────────────────────────────────────
      .addCase(registerUser.pending,   pending)
      .addCase(registerUser.rejected,  rejected)
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        // Backend returns { user, token } on successful register
        state.user       = payload.user   ?? payload.data?.user;
        state.token      = payload.token  ?? payload.data?.token;
        state.isLoggedIn = !!state.token;
      })

      // ── Login ─────────────────────────────────────────────────
      .addCase(loginUser.pending,   pending)
      .addCase(loginUser.rejected,  rejected)
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading  = false;
        state.user       = payload.user   ?? payload.data?.user;
        state.token      = payload.token  ?? payload.data?.token;
        state.isLoggedIn = !!state.token;
      })

      // ── Logout ────────────────────────────────────────────────
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected,  () => initialState) // always clear on logout

      // ── Get Me ────────────────────────────────────────────────
      .addCase(getLoggedInUser.pending,   pending)
      .addCase(getLoggedInUser.rejected,  (state, { payload }) => {
        // 401 = session expired → clear everything
        if (payload?.status === 401) return initialState;
        state.isLoading = false;
        // Don't set error — silent failure is fine for background refresh
      })
      .addCase(getLoggedInUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        const user = payload.user ?? payload.data?.user;
        if (user) state.user = user;
      })

      // ── Forgot / Reset / Update Password ─────────────────────
      .addCase(forgotPassword.pending,   pending)
      .addCase(forgotPassword.rejected,  rejected)
      .addCase(forgotPassword.fulfilled, (state) => { state.isLoading = false; })

      .addCase(resetPassword.pending,   pending)
      .addCase(resetPassword.rejected,  rejected)
      .addCase(resetPassword.fulfilled, (state) => { state.isLoading = false; })

      .addCase(updatePassword.pending,   pending)
      .addCase(updatePassword.rejected,  rejected)
      .addCase(updatePassword.fulfilled, (state) => { state.isLoading = false; });
  },
});

export const { setCredits, patchUser, clearAuthError, resetAuth } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────
export const selectUser       = (s) => s.auth.user;
export const selectToken      = (s) => s.auth.token;
export const selectIsLoggedIn = (s) => s.auth.isLoggedIn;
export const selectCredits    = (s) => s.auth.user?.credits ?? 0;
export const selectIsAdmin    = (s) => s.auth.user?.role === 'admin';
export const selectAuthLoading = (s) => s.auth.isLoading;
export const selectAuthError  = (s) => s.auth.error;