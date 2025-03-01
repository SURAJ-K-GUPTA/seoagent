import { configureStore } from '@reduxjs/toolkit';
import websiteReducer from './websiteSlice';

export const store = configureStore({
  reducer: {
    website: websiteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 