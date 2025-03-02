'use client';

import { useEffect, useState } from 'react';
import { EditorContent, EditorRoot, EditorBubble, EditorBubbleItem, TiptapImage,
    TiptapLink,
    UpdatedImage,
    TaskList,
    TaskItem,
    HorizontalRule,
    StarterKit,
    Placeholder, } from 'novel';
import { Markdown } from "tiptap-markdown";
import { Button } from '@/components/ui/button';
import { Save, Sparkles, Check, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
// import { StarterKit } from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
// import Placeholder from '@tiptap/extension-placeholder';
import { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { marked } from 'marked';

// Define the suggestion type
interface Suggestion {
  original: string;
  suggestion: string;
  reasoning: string;
}

export function NovelEditor() {
  const { data } = useSelector((state: RootState) => state.website);
  const [isReady, setIsReady] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<string>("Idle");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  
  const debouncedUpdates = useDebouncedCallback(
    async (props: { editor: any; transaction: any }) => {
      const json = props.editor.getJSON();
      setContent(json);
      setSaveStatus("Saved");
    }, 
    500
  );

  // Process content when data changes
  useEffect(() => {
    const processContent = async () => {
      if (data) {
        try {
          // Clean markdown content function
          const cleanMarkdown = (text: string) => {
            return text
              // Remove image markdown
              .replace(/!\[.*?\]\(.*?\)/g, '')
              // Convert links to just their text content
              .replace(/\[(.*?)\]\(.*?\)/g, '$1')
              // Remove backslashes before markdown characters
              .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1');
          };
          
          // Create document with title and meta description
          const documentContent = [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: data.title || 'Untitled' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: data.metaDescription || '' }]
            }
          ];

          // Process full content
          if (data.content) {
            // Process all content, not just specific lines
            const contentLines = data.content.split('\n');
            
            let currentParagraph = '';
            
            // Process line by line to properly handle text flow
            contentLines.forEach((line, index) => {
              const trimmedLine = cleanMarkdown(line.trim());
              
              // Check for headings
              const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
              
              if (headingMatch) {
                // If we have accumulated paragraph text, add it first
                if (currentParagraph) {
                  documentContent.push({
                    type: 'paragraph',
                    content: [{ type: 'text', text: currentParagraph }]
                  });
                  currentParagraph = '';
                }
                
                // Then add the heading
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                documentContent.push({
                  type: 'heading',
                  attrs: { level: Math.min(level, 6) },
                  content: [{ type: 'text', text }]
                });
              }
              // If line is empty and we have paragraph content
              else if (!trimmedLine && currentParagraph) {
                // End current paragraph
                documentContent.push({
                  type: 'paragraph',
                  content: [{ type: 'text', text: currentParagraph }]
                });
                currentParagraph = '';
              }
              // Otherwise accumulate text
              else if (trimmedLine) {
                if (currentParagraph) currentParagraph += ' ';
                currentParagraph += trimmedLine;
              }
            });
            
            // Add any remaining paragraph text
            if (currentParagraph) {
              documentContent.push({
                type: 'paragraph',
                content: [{ type: 'text', text: currentParagraph }]
              });
            }
          }
          
          setContent({
            type: 'doc',
            content: documentContent
          });
        } catch (error) {
          console.error('Error processing content:', error);
          // Include full content in fallback
          setContent({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: data.content || 'No content available' }]
              }
            ]
          });
        }
      }
    };
    
    processContent();
  }, [data]);

  // Set ready state after component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Generate SEO suggestion
  const generateSuggestion = async (editor: any) => {
    try {
      setIsGeneratingSuggestion(true);
      setSuggestion(null);
      
      // Get selected text or current paragraph
      const selectedText = editor.state.selection.content().content.firstChild?.text;
      const contentToAnalyze = selectedText || editor.getText();
      
      // Call the AI suggestion API
      const response = await axios.post('/api/ai/suggestions', {
        content: contentToAnalyze,
        type: 'content'
      });
      
      if (response.data.success) {
        setSuggestion(response.data.suggestion);
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Apply suggestion to editor
  const applySuggestion = (editorElement) => {
    if (!suggestion) return;
    
    // Get the editor instance from the DOM element
    const editor = editorElement?.__vue__?.$editor || editorElement?.__editor;
    
    if (editor) {
      // Store the current selection
      const { from, to } = editor.state.selection;
      
      // If there's a selected range, replace it
      if (from !== to) {
        editor.commands.setContent(suggestion.suggestion, {
          from,
          to
        });
      } else {
        // If no selection, insert at current cursor position
        editor.commands.insertContent(suggestion.suggestion);
      }
      
      // Clear the suggestion after applying
      setSuggestion(null);
      
      // Update save status
      setSaveStatus("Saving...");
      setTimeout(() => setSaveStatus("Saved"), 500);
    }
  };

  if (!data) {
    return (
      <div className="border rounded-lg p-8 text-center bg-muted/30 h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Enter a URL above to analyze content</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden h-[70vh]">
      <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
        <h2 className="font-medium">Content Editor</h2>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSaveStatus("Saved")}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            {saveStatus}
          </Button>
          <span className="text-xs text-muted-foreground">{data.url}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(70vh-40px)]">
        <div className="col-span-2 overflow-auto border-r">
          {isReady && content ? (
            <EditorRoot>
                <EditorBubble className="flex bg-white shadow-xl border border-muted rounded-lg overflow-hidden divide-x">
                  <EditorBubbleItem
                  onSelect={(props: any) => {
                    generateSuggestion(props.editor);
                  }}
                >
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Suggest Improvements</span>
                  </Button>
                </EditorBubbleItem>
                <EditorBubbleItem
                  onSelect={(props: any) => {
                    // Save content
                    setSaveStatus("Saving...");
                    setTimeout(() => setSaveStatus("Saved"), 500);
                  }}
                >
                  <Button variant="ghost" size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                </EditorBubbleItem>
              </EditorBubble>
              <EditorContent
                onUpdate={debouncedUpdates}
                initialContent={content}
                extensions={[
                  TiptapImage,
          TiptapLink,
          UpdatedImage,
          TaskList,
          TaskItem,
          HorizontalRule,
                  StarterKit,
                  Image.configure({
                    allowBase64: true,
                    HTMLAttributes: {
                      class: 'rounded-lg max-w-full h-auto',
                    },
                  }),
                  Link.configure({
                    openOnClick: true,
                    HTMLAttributes: {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      class: 'text-blue-500 underline'
                    }
                  }),
                  Placeholder.configure({
                    placeholder: 'Start editing content...',
                  }),
                  Markdown.configure({
                    html: false,
                    transformPastedText: true,
                    transformCopiedText: true
                  })
                ]}
                className="prose prose-sm sm:prose-base dark:prose-invert h-full"
                editorProps={{
                  attributes: {
                    class: 'prose-lg dark:prose-invert focus:outline-none max-w-full h-full p-4',
                  }
                }}
              />
            </EditorRoot>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading editor...</p>
            </div>
          )}
        </div>
        
        {/* Suggestion Panel */}
        <div className="col-span-1 overflow-auto p-4">
          <h3 className="text-lg font-medium mb-4">SEO Suggestions</h3>
          
          {isGeneratingSuggestion ? (
            <div className="flex items-center justify-center h-40 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Generating suggestions...</p>
            </div>
          ) : suggestion ? (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Improvement</CardTitle>
                <CardDescription>Select text and click "Suggest Improvements" for more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Original</h4>
                  <p className="text-sm border-l-2 border-muted pl-2">{suggestion.original}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Suggestion</h4>
                  <p className="text-sm border-l-2 border-green-500 pl-2">{suggestion.suggestion}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Reasoning</h4>
                  <p className="text-sm">{suggestion.reasoning}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setSuggestion(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => {
                    const editorElement = document.querySelector('.ProseMirror');
                    applySuggestion(editorElement);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 border rounded-lg bg-muted/20">
              <Sparkles className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                Select text and click "Suggest Improvements" <br />
                to get AI-powered SEO suggestions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 