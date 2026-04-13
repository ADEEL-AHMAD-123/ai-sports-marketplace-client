// src/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer    from './slices/authSlice';
import uiReducer      from './slices/uiSlice';
import oddsReducer    from './slices/oddsSlice';
import insightReducer from './slices/insightSlice';

const rootReducer = combineReducers({
  auth:     authReducer,
  ui:       uiReducer,
  odds:     oddsReducer,
  insights: insightReducer,
});

// Persist auth (token + user) and ui (theme + active sport)
// Do NOT persist odds or insights — always fresh from server
const persistConfig = {
  key:       'edgeiq',
  storage,
  // Only persist user session (auth) and UI preferences (theme, sport)
  // Odds and insights are NEVER persisted — always fetch fresh from backend on load
  // Backend handles caching with Redis — frontend just displays what it receives
  whitelist: ['auth', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);