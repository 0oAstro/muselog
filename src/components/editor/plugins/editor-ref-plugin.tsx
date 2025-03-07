"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";

export function EditorRefPlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<LexicalEditor | null>(null);

  const setEditorRef = useCallback(
    (editor: LexicalEditor) => {
      editorRef.current = editor;
      // Make the editor available globally for debugging in development
      if (process.env.NODE_ENV === "development") {
        (window as any).editor = editor;
      }
    },
    []
  );

  useEffect(() => {
    setEditorRef(editor);
    return () => {
      editorRef.current = null;
    };
  }, [editor, setEditorRef]);

  return null;
}
