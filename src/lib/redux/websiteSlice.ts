import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Define the WebsiteData interface
interface WebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  headings: { level: number; text: string; position: number }[];
  metaKeywords: string[];
  readabilityScore: number;
}

interface WebsiteState {
  data: WebsiteData | null;
  loading: boolean;
  error: string | null;
}

const initialState: WebsiteState = {
  data: null,
  loading: false,
  error: null,
};

// Create async thunk for fetching website data
export const analyzeWebsite = createAsyncThunk(
  'website/analyze',
  async (url: string) => {
    const response = await fetch('/api/site-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze website');
    }
    
    const data = await response.json();
    return data.data;
  }
);

const websiteSlice = createSlice({
  name: 'website',
  initialState,
  reducers: {
    clearWebsiteData: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeWebsite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeWebsite.fulfilled, (state, action: PayloadAction<WebsiteData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(analyzeWebsite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to analyze website';
      });
  },
});

export const { clearWebsiteData } = websiteSlice.actions;
export default websiteSlice.reducer; 