import { UrlAnalyzer } from '@/components/url-analyzer';
import { AnalysisAgents } from '@/components/analysis-agents';
import { NovelEditor } from '@/components/novel-editor';

export default function Home() {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">SEO Meta Comparison Tool</h1>
      
      {/* URL Input at the top */}
      <div className="mb-8">
        <UrlAnalyzer />
      </div>
      
      {/* Two-column layout: Editor on left, Agents on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <NovelEditor />
        </div>
        
        {/* Analysis agents take 1/3 of the space */}
        <div className="lg:col-span-1">
          <AnalysisAgents />
        </div>
      </div>
    </div>
  );
}
