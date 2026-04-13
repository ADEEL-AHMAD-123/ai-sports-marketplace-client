// src/utils/apiHelper.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Creates a reusable async thunk for API calls.
 *
 * Usage:
 *   export const loginUser = createApiThunk({
 *     typePrefix: 'auth/login',
 *     method: 'POST',
 *     url: '/auth/login',
 *   });
 *
 *   // Dynamic URL:
 *   export const getProps = createApiThunk({
 *     typePrefix: 'odds/getProps',
 *     method: 'GET',
 *     url: ({ sport, eventId }) => `/odds/${sport}/games/${eventId}/props`,
 *   });
 *
 * Dispatching:
 *   dispatch(loginUser({ data: { email, password } }))
 *   dispatch(getProps({ sport: 'nba', eventId: '123', params: { filter: 'highConfidence' } }))
 */
export const createApiThunk = ({ typePrefix, method, url }) =>
  createAsyncThunk(
    typePrefix,
    async ({ data = {}, params = {}, ...rest } = {}, { rejectWithValue, getState }) => {
      try {
        const token = getState().auth?.token;

        const isFormData = data instanceof FormData;

        const headers = {
          ...(!isFormData && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const resolvedUrl = typeof url === 'function' ? url(rest) : url;

        const response = await axios({
          method,
          url: `${BASE_URL}${resolvedUrl}`,
          data,
          params,
          headers,
          withCredentials: true,
        });

        return response.data;
      } catch (error) {
        const errData = {
          message:
            error?.response?.data?.message ||
            error?.message ||
            'Something went wrong',
          status: error?.response?.status || 500,
          details: error?.response?.data || null,
        };
        console.error(`[API Error] ${typePrefix}:`, errData);
        return rejectWithValue(errData);
      }
    }
  );