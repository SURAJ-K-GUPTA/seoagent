import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the WebsiteData interface
export interface WebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string[];
  content: string;
  headings: { level: number; text: string }[];
  wordCount: number;
  readabilityScore: number;
  readabilityLevel: string;
  // other existing properties...
}

// Define the state interface
export interface WebsiteState {
  data: WebsiteData | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: WebsiteState = {
  data: null,
  loading: false,
  error: null,
};

// Create the slice
const websiteSlice = createSlice({
  name: 'website',
  initialState,
  reducers: {
    // Your existing reducers...
  },
});

export const { /* your actions */ } = websiteSlice.actions;
export default websiteSlice.reducer; 