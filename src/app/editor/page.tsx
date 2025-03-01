'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { NovelEditor } from '@/components/novel-editor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditorPage() {
  const { data } = useSelector((state: RootState) => state.website);

  if (!data) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">No Content to Edit</h1>
        <p className="mb-8">Please analyze a website first to load content into the editor.</p>
        <Link href="/">
          <Button>Go to Analyzer</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Website Content</h1>
        <Link href="/">
          <Button variant="outline">Back to Analyzer</Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
        <p className="text-muted-foreground">{data.url}</p>
      </div>
      
      <NovelEditor />
    </div>
  );
} 