'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeWebsite } from '@/lib/redux/websiteSlice';
import { AppDispatch, RootState } from '@/lib/redux/store';

export function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.website);

  const handleAnalyze = () => {
    if (url) {
      dispatch(analyzeWebsite(url));
    }
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter website URL (e.g., https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleAnalyze} disabled={loading || !url}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
} 