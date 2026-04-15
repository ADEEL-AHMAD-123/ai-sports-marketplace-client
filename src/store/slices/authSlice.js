// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createApiThunk } from '@/utils/apiHelper';

// ── API Thunks ────────────────────────────────────────────────
export const registerUser    = createApiThunk({ typePrefix: 'auth/register',        method: 'POST', url: '/auth/register'        });
export const loginUser       = createApiThunk({ typePrefix: 'auth/login',           method: 'POST', url: '/auth/login'           });
export const logoutUser      = createApiThunk({ typePrefix: 'auth/logout',          method: 'POST', url: '/auth/logout'          });
export const getLoggedInUser = createApiThunk({ typePrefix: 'auth/getMe',           method: 'GET',  url: '/auth/me'              });
export const forgotPassword  = createApiThunk({ typePrefix: 'auth/forgotPassword',  method: 'POST', url: '/auth/forgot-password' });
export const resetPassword   = createApiThunk({ typePrefix: 'auth/resetPassword',   method: 'POST', url: '/auth/reset-password'  });
export const updatePassword  = createApiThunk({ typePrefix: 'auth/updatePassword',  method: 'PUT',  url: '/auth/update-password' });

// ── Helper — extract user+token from any response shape ───────
// Backend returns: { success, user, token } (no data wrapper)
const extractAuth = (payload) => ({
  user:  payload?.user  ?? null,
  token: payload?.token ?? null,
});

// ── Slice ─────────────────────────────────────────────────────
const initialState = {
  user:       null,
  token:      null,
  isLoggedIn: false,
  isLoading:  false,
  error:      null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredits(state, { payload }) {
      if (state.user) state.user.credits = payload;
    },
    patchUser(state, { payload }) {
      if (state.user) state.user = { ...state.user, ...payload };
    },
    clearAuthError(state) {
      state.error = null;
    },
    resetAuth: () => initialState,
  },

  extraReducers: (builder) => {
    const pending  = (state) => { state.isLoading = true; state.error = null; };
    const rejected = (state, { payload }) => {
      state.isLoading = false;
      state.error = payload?.message || 'Something went wrong';
    };

    builder
      // Register
      .addCase(registerUser.pending,   pending)
      .addCase(registerUser.rejected,  rejected)
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        const { user, token } = extractAuth(payload);
        state.isLoading = false;
        state.user      = user;
        state.token     = token;
        state.isLoggedIn = !!token;
      })

      // Login
      .addCase(loginUser.pending,   pending)
      .addCase(loginUser.rejected,  rejected)
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        const { user, token } = extractAuth(payload);
        state.isLoading  = false;
        state.user       = user;
        state.token      = token;
        state.isLoggedIn = !!token;
      })

      // Logout — always clear everything
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(logoutUser.rejected,  () => initialState)

      // Get Me — background refresh, 401 = session expired
      .addCase(getLoggedInUser.pending,   pending)
      .addCase(getLoggedInUser.rejected,  (state, { payload }) => {
        state.isLoading = false;
        if (payload?.status === 401) return initialState;
      })
      .addCase(getLoggedInUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        // /api/auth/me returns { success, user } — no token refresh needed
        if (payload?.user) {
          state.user      = payload.user;
          state.isLoggedIn = true;
        }
      })

      // Password flows
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
export const selectUser        = (s) => s.auth.user;
export const selectToken       = (s) => s.auth.token;
export const selectIsLoggedIn  = (s) => s.auth.isLoggedIn;
export const selectCredits     = (s) => s.auth.user?.credits ?? 0;
export const selectIsAdmin     = (s) => s.auth.user?.role === 'admin';
export const selectAuthLoading = (s) => s.auth.isLoading;
export const selectAuthError   = (s) => s.auth.error;