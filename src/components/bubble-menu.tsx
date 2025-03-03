import { EditorBubble, EditorBubbleItem, EditorContent, useEditor } from "novel";
import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { ColorSelector } from "./selectors/color-selector";
import { TextButtons } from "./selectors/text-buttons";
import { useState } from "react";   

export const BubbleMenu = () => {
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const { editor } = useEditor();

  if (!editor) return null;

  return(

      <EditorBubble
        tippyOptions={{
          placement: openAI ? "bottom-start" : "top",
        }}
        className='flex w-fit max-w-[90vw] overflow-hidden rounded border border-muted bg-background shadow-xl'>
          <NodeSelector open={openNode} onOpenChange={() => setOpenNode(!openNode)} />
          <LinkSelector open={openLink} onOpenChange={() => setOpenLink(!openLink)} />
          <TextButtons />
          <ColorSelector open={openColor} onOpenChange={() => setOpenColor(!openColor)} />
      </EditorBubble>

  )
};

