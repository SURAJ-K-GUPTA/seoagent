'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Sparkles, Check, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define the suggestion type
interface Suggestion {
  original: string;
  suggestion: string;
  reasoning: string;
}

export function AnalysisAgents() {
  const { data, loading } = useSelector((state: RootState) => state.website);
  const [openSection, setOpenSection] = useState<string | null>('meta');
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion | null>>({
    title: null,
    meta: null,
    headings: null,
    content: null
  });
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const generateSuggestion = async (type: string, content: string) => {
    try {
      setGeneratingFor(type);
      
      // For heading analysis, we need to call a different endpoint
      if (type === 'heading') {
        const response = await axios.post('/api/heading-analysis', {
          url: data.url,
          headings: data.headings,
          websiteData: data
        });
        
        if (response.data.success && response.data.headingAnalysis) {
          // Extract the first suggestion from the heading analysis
          const headingSuggestion = response.data.headingAnalysis.suggestions[0];
          if (headingSuggestion) {
            setSuggestions(prev => ({
              ...prev,
              headings: {
                original: headingSuggestion.original,
                suggestion: headingSuggestion.suggested,
                reasoning: headingSuggestion.reasoning
              }
            }));
          }
        }
      } 
      // For meta analysis, we need to call the meta-analysis endpoint
      else if (type === 'title' || type === 'meta') {
        const response = await axios.post('/api/meta-analysis', {
          url: data.url,
          title: data.title,
          metaDescription: data.metaDescription,
          websiteData: data
        });
        
        if (response.data.success && response.data.metaAnalysis) {
          // Extract the relevant suggestion from the meta analysis
          const metaSuggestions = response.data.metaAnalysis.suggestions;
          const relevantSuggestion = metaSuggestions.find(s => s.type === (type === 'title' ? 'title' : 'description'));
          
          if (relevantSuggestion) {
            setSuggestions(prev => ({
              ...prev,
              [type]: {
                original: relevantSuggestion.original,
                suggestion: relevantSuggestion.suggested,
                reasoning: relevantSuggestion.reasoning
              }
            }));
          }
        }
      }
      // For other types, use the general AI suggestions endpoint
      else {
        const response = await axios.post('/api/ai/suggestions', {
          content,
          type
        });
        
        if (response.data.success) {
          setSuggestions(prev => ({
            ...prev,
            [type]: response.data.suggestion
          }));
        }
      }
    } catch (error) {
      console.error(`Error generating ${type} suggestion:`, error);
    } finally {
      setGeneratingFor(null);
    }
  };

  // First, create a function to update editor content
  const updateEditorContent = (type: string, newContent: string) => {
    const editorElement = document.querySelector('.ProseMirror');
    const editor = (editorElement as any)?.editor;
    
    if (!editor) return;

    // Get the original text to replace
    const originalText = suggestions[type]?.original || '';
    
    // Find all text nodes in the document
    const textNodes: { node: any; pos: number }[] = [];
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.isText || node.type.name === 'heading') {
        textNodes.push({ node, pos });
      }
      return true;
    });

    // Find the node containing the original text
    const targetNode = textNodes.find(({ node }) => {
      const nodeText = node.type.name === 'heading' ? node.textContent : node.text;
      return nodeText?.includes(originalText);
    });

    if (targetNode) {
      // Replace the text at the found position
      editor.commands.setContent(newContent, {
        from: targetNode.pos,
        to: targetNode.pos + targetNode.node.nodeSize
      });
    } else {
      // If no matching text found, handle based on type
      switch (type) {
        case 'title':
          // Insert at the beginning as H1
          editor.commands.insertContent([
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: newContent }]
            }
          ], { at: 0 });
          break;

        case 'meta':
          // Meta description handling (if needed)
          break;

        default:
          // Insert at cursor position
          editor.commands.insertContent(newContent);
      }
    }
  };

  // Then update the applySuggestion function
  const applySuggestion = async (type: string) => {
    if (!suggestions[type]) return;
    
    try {
      // Send the suggestion to the appropriate API endpoint
      const endpoints = {
        title: '/api/meta-analysis',
        meta: '/api/meta-analysis',
        headings: '/api/heading-analysis',
        content: '/api/custom-analysis'
      };
      
      await axios.post(endpoints[type], {
        url: data.url,
        suggestion: suggestions[type]?.suggestion
      });
      
      // Update the editor content
      updateEditorContent(type, suggestions[type]?.suggestion || '');
      
      // Clear the suggestion after applying
      setSuggestions(prev => ({
        ...prev,
        [type]: null
      }));
      
    } catch (error) {
      console.error(`Error applying ${type} suggestion:`, error);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-8 text-center bg-muted/30 h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    );
  }

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
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2"
                    onClick={() => generateSuggestion('title', data.title)}
                    disabled={generatingFor === 'title'}
                  >
                    <Sparkles size={12} className="mr-1" />
                    {generatingFor === 'title' ? 'Generating...' : 'Suggest'}
                  </Button>
                </div>
                <p className="text-sm">{data.title}</p>
                
                {suggestions.title && (
                  <Card className="mt-2">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Suggested Title</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <p className="text-sm">{suggestions.title.suggestion}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestions.title.reasoning}</p>
                    </CardContent>
                    <CardFooter className="py-2 px-3 flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={() => setSuggestions(prev => ({ ...prev, title: null }))}
                      >
                        <X size={12} className="mr-1" />
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => applySuggestion('title')}
                      >
                        <Check size={12} className="mr-1" />
                        Apply
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2"
                    onClick={() => generateSuggestion('meta', data.metaDescription || "No description found")}
                    disabled={generatingFor === 'meta'}
                  >
                    <Sparkles size={12} className="mr-1" />
                    {generatingFor === 'meta' ? 'Generating...' : 'Suggest'}
                  </Button>
                </div>
                <p className="text-sm">{data.metaDescription || "No description found"}</p>
                
                {suggestions.meta && (
                  <Card className="mt-2">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Suggested Description</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <p className="text-sm">{suggestions.meta.suggestion}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestions.meta.reasoning}</p>
                    </CardContent>
                    <CardFooter className="py-2 px-3 flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={() => setSuggestions(prev => ({ ...prev, meta: null }))}
                      >
                        <X size={12} className="mr-1" />
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => applySuggestion('meta')}
                      >
                        <Check size={12} className="mr-1" />
                        Apply
                      </Button>
                    </CardFooter>
                  </Card>
                )}
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
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Heading Structure</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2"
                    onClick={() => generateSuggestion('heading', JSON.stringify(data.headings))}
                    disabled={generatingFor === 'heading'}
                  >
                    <Sparkles size={12} className="mr-1" />
                    {generatingFor === 'heading' ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
                
                <div className="mt-2 space-y-2">
                  {data.headings.map((heading, index) => (
                    <div key={index} className={`pl-${heading.level * 2} text-sm`}>
                      <span className="text-xs font-mono text-muted-foreground mr-2">H{heading.level}</span>
                      {heading.text}
                    </div>
                  ))}
                </div>
                
                {suggestions.headings && (
                  <Card className="mt-3">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Suggested Heading Improvement</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Original</h4>
                        <p className="text-sm">{suggestions.headings.original}</p>
                      </div>
                      <div className="mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Suggestion</h4>
                        <p className="text-sm">{suggestions.headings.suggestion}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{suggestions.headings.reasoning}</p>
                    </CardContent>
                    <CardFooter className="py-2 px-3 flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={() => setSuggestions(prev => ({ ...prev, headings: null }))}
                      >
                        <X size={12} className="mr-1" />
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => applySuggestion('headings')}
                      >
                        <Check size={12} className="mr-1" />
                        Apply
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Content Analysis */}
        <div className="border-b">
          <button 
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/50"
            onClick={() => toggleSection('content')}
          >
            <span className="font-medium">Content Analysis</span>
            {openSection === 'content' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSection === 'content' && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Content Overview</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2"
                    onClick={() => generateSuggestion('content', data.content.substring(0, 500))}
                    disabled={generatingFor === 'content'}
                  >
                    <Sparkles size={12} className="mr-1" />
                    {generatingFor === 'content' ? 'Generating...' : 'Suggest'}
                  </Button>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Word Count:</span>
                    <span className="font-medium">{data.wordCount ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Readability Score:</span>
                    <span className="font-medium">{data.readabilityScore ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Readability Level:</span>
                    <span className="font-medium">
                      {data.readabilityScore > 30 ? "Easy to read" : 
                       data.readabilityScore > 15 ? "Moderately difficult" : 
                       "Difficult to read"}
                    </span>
                  </div>
                </div>
                
                {suggestions.content && (
                  <Card className="mt-3">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Content Improvement Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <p className="text-sm">{suggestions.content.suggestion}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestions.content.reasoning}</p>
                    </CardContent>
                    <CardFooter className="py-2 px-3 flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={() => setSuggestions(prev => ({ ...prev, content: null }))}
                      >
                        <X size={12} className="mr-1" />
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => applySuggestion('content')}
                      >
                        <Check size={12} className="mr-1" />
                        Apply
                      </Button>
                    </CardFooter>
                  </Card>
                )}
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