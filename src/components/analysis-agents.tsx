'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function AnalysisAgents() {
  const { data, loading } = useSelector((state: RootState) => state.website);
  const [openSection, setOpenSection] = useState<string | null>('meta');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (!data) {
    return (
      <div className="border rounded-lg p-8 text-center bg-muted/30 h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Analysis will appear here</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden h-[70vh] flex flex-col">
      <div className="bg-muted px-4 py-2 border-b">
        <h2 className="font-medium">Analysis Agents</h2>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {/* Meta Analysis */}
        <div className="border-b">
          <button 
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/50"
            onClick={() => toggleSection('meta')}
          >
            <span className="font-medium">Meta Analysis</span>
            {openSection === 'meta' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSection === 'meta' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                <p className="text-sm">{data.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm">{data.metaDescription || "No description found"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Keywords</h3>
                <p className="text-sm">{data.metaKeywords.length > 0 ? data.metaKeywords.join(', ') : "No keywords found"}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Heading Analysis */}
        <div className="border-b">
          <button 
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/50"
            onClick={() => toggleSection('headings')}
          >
            <span className="font-medium">Heading Analysis</span>
            {openSection === 'headings' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSection === 'headings' && (
            <div className="p-4">
              {data.headings.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.headings.map((heading, index) => (
                    <div key={index} className={`pl-${heading.level * 2} text-sm`}>
                      <span className="font-medium">H{heading.level}:</span> {heading.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm">No headings found</p>
              )}
            </div>
          )}
        </div>
        
        {/* Readability Analysis */}
        <div className="border-b">
          <button 
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/50"
            onClick={() => toggleSection('readability')}
          >
            <span className="font-medium">Readability Analysis</span>
            {openSection === 'readability' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSection === 'readability' && (
            <div className="p-4">
              <div className="mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Score</h3>
                <p className="text-sm">{data.readabilityScore.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Assessment</h3>
                <p className="text-sm">
                  {data.readabilityScore > 30 ? "Easy to read" : 
                   data.readabilityScore > 15 ? "Moderately difficult" : 
                   "Difficult to read"}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Custom Analysis Button */}
        <div className="p-4">
          <Button className="w-full" variant="outline">
            Run Custom Analysis
          </Button>
        </div>
      </div>
    </div>
  );
} 