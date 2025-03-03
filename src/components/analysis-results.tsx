'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { NovelEditor } from './novel-editor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AnalysisResults() {
  const { data, loading } = useSelector((state: RootState) => state.website);

  if (loading) {
    return <div className="mt-8 text-center">Analyzing website...</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{data.title}</h2>
        <Link href="/editor">
          <Button variant="outline">Open in Editor</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Meta Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">URL:</span> {data.url}</p>
            <p><span className="font-medium">Description:</span> {data.metaDescription}</p>
            <p><span className="font-medium">Keywords:</span> {data.metaKeywords.join(', ')}</p>
            <p><span className="font-medium">Readability Score:</span> {data.readabilityScore.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Headings Structure</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.headings.map((heading, index) => (
              <div key={index} className="pl-[calc(1rem*heading.level-1)]">
                <p className="text-sm">
                  <span className="font-medium">H{heading.level}:</span> {heading.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Content Preview</h3>
        <div className="max-h-96 overflow-y-auto prose prose-sm dark:prose-invert">
          {data.content}
        </div>
      </div>
      
      <NovelEditor />
    </div>
  );
} 