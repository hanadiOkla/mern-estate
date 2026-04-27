import { combineReducers, configureStore } from '@reduxjs/toolkit';
import userReducer from '../redux/user/userSlice.js';
import { persistReducer, persistStore } from 'redux-persist'; // تأكدي من الاسم هنا: persistReducer
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({ user: userReducer });

const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

// هنا التعديل: استدعاء الدالة persistReducer وتخزينها في متغير persistedReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer, // تأكدي أن الاسم يطابق المتغير في السطر السابق
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);