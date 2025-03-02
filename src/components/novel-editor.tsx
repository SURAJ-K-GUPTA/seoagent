'use client';

import { useEffect, useState } from 'react';
import { EditorContent, EditorRoot, EditorInstance, EditorBubble, EditorBubbleItem } from 'novel';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { StarterKit } from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { JSONContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce' // You'll need to install this package

export function NovelEditor() {
  const { data } = useSelector((state: RootState) => state.website);
  const [isReady, setIsReady] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<string>("Idle");
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
    if (data?.content) {
      // Create a simple document structure
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.content
              }
            ]
          }
        ]
      };
      setContent(doc);
    }
  }, [data?.content]);

  // Set ready state after component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);

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
        <span className="text-xs text-muted-foreground">{data.url}</span>
      </div>
      <div className="h-[calc(70vh-40px)] overflow-auto">
        {isReady && content ? (
          <EditorRoot>
            <EditorBubble>
                <EditorBubbleItem>
                            <Button>
                                <Save />
                            </Button>
                </EditorBubbleItem>
            </EditorBubble>
            <EditorContent
              onUpdate={debouncedUpdates}
              initialContent={content}
              extensions={[
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
    </div>
  );
} 