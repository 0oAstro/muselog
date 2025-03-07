"use client";

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { EditorRefPlugin } from "./plugins/editor-ref-plugin";
import { ToolbarPlugin } from "./plugins/toolbar-plugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { SerializedEditorState } from "lexical";
import { cn } from "@/lib/utils";

export type EditorProps = {
  editorState?: SerializedEditorState;
  onChange?: (editorState: SerializedEditorState) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  editable?: boolean;
};

export function Editor({
  editorState,
  onChange,
  placeholder = "Start writing...",
  autoFocus = false,
  className,
  editable = true,
}: EditorProps) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isSmallWidth = window.matchMedia("(max-width: 640px)").matches;
      setIsSmallWidthViewport(isSmallWidth);
    };

    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, []);

  const initialConfig = {
    namespace: "muselog-editor",
    onError: (error: Error) => {
      console.error(error);
    },
    editable,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    theme: {
      paragraph: "mb-2 last:mb-0",
      heading: {
        h1: "text-3xl font-bold mb-3",
        h2: "text-2xl font-bold mb-3",
        h3: "text-xl font-bold mb-3",
        h4: "text-lg font-bold mb-3",
        h5: "text-base font-bold mb-3",
        h6: "text-sm font-bold mb-3",
      },
      list: {
        ul: "list-disc ml-6 mb-2",
        ol: "list-decimal ml-6 mb-2",
        listitem: "mb-1",
        nested: {
          listitem: "mb-1",
        },
      },
      link: "text-primary underline",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        code: "bg-muted p-1 rounded font-mono text-sm",
      },
      quote: "border-l-4 border-muted pl-4 italic my-4",
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn("border rounded-md", className)}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[200px] outline-none p-4 prose prose-sm dark:prose-invert max-w-none"
                spellCheck={true}
              />
            }
            placeholder={
              <div className="absolute top-[1.125rem] left-[1.125rem] text-muted-foreground select-none pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          {autoFocus && <AutoFocusPlugin />}
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          {onChange && <OnChangePlugin onChange={onChange} />}
          <EditorRefPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
