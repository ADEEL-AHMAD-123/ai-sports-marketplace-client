// src/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer    from './slices/authSlice';
import uiReducer      from './slices/uiSlice';
import oddsReducer    from './slices/oddsSlice';
import insightReducer from './slices/insightSlice';

// ui slice — persist theme + activeSport but NOT activeFilter
// activeFilter must always reset to 'all' on new session (prevents stale filter showing 0 results)
const uiPersistConfig = {
  key:      'ui',
  storage,
  blacklist: ['activeFilter'],
};

const rootReducer = combineReducers({
  auth:     authReducer,
  ui:       persistReducer(uiPersistConfig, uiReducer),
  odds:     oddsReducer,
  insights: insightReducer,
});

// Root persist — only auth + ui (odds and insights always fetch fresh)
const persistConfig = {
  key:      'edgeiq',
  storage,
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