// store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './slices/authSlice';
import uiReducer   from './slices/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ui:   uiReducer,
});

const persistConfig = {
  key: 'edgeiq',
  storage,
  whitelist: ['auth', 'ui'], // both persisted; ui saves theme + sport preference
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