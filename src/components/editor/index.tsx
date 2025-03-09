"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import YooptaEditor, {
  createYooptaEditor,
  Elements,
  Blocks,
  useYooptaEditor,
  YooptaContentValue,
  YooptaOnChangeOptions,
} from "@yoopta/editor";
import ActionMenuList, {
  DefaultActionMenuRender,
} from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import { NotionActionMenuRender } from "./NotionActionMenuRender";
import { cn } from "@/lib/utils";
// Import the initial value
import { WITH_BASIC_INIT_VALUE } from "./initValue";

// Import all plugins
import Paragraph from "@yoopta/paragraph";
import Blockquote from "@yoopta/blockquote";
import Embed from "@yoopta/embed";
import Image from "@yoopta/image";
import Link from "@yoopta/link";
import Callout from "@yoopta/callout";
import Video from "@yoopta/video";
import File from "@yoopta/file";
import Accordion from "@yoopta/accordion";
import { NumberedList, BulletedList, TodoList } from "@yoopta/lists";
import {
  Bold,
  Italic,
  CodeMark,
  Underline,
  Strike,
  Highlight,
} from "@yoopta/marks";
import { HeadingOne, HeadingTwo, HeadingThree } from "@yoopta/headings";
import Code from "@yoopta/code";
import Table from "@yoopta/table";
import Divider from "@yoopta/divider";

export type EditorProps = {
  editorState?: YooptaContentValue;
  onChange?: (
    editorState: YooptaContentValue,
    options?: YooptaOnChangeOptions
  ) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  editable?: boolean;
};

// Define plugins
const PLUGINS = [
  Paragraph,
  Table,
  Divider,
  Accordion,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
  Embed,
  Image,
  Video,
  File,
];

// Define marks
const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

// Define tools
const TOOLS = {
  ActionMenu: {
    render: NotionActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
};

const EDITOR_STYLE = {
  minHeight: "200px",
  padding: "1rem",
};

export function Editor({
  editorState,
  onChange,
  placeholder = "Start writing...",
  autoFocus = false,
  className,
  editable = true,
}: EditorProps) {
  const editor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef(null);

  // Initialize with base init value if no editor state is provided
  const initialValue = useMemo(() => {
    return editorState && Object.keys(editorState).length > 0
      ? editorState
      : WITH_BASIC_INIT_VALUE;
  }, [editorState]);

  const [value, setValue] = useState<YooptaContentValue>(initialValue);

  // Handle changes
  const handleChange = (
    newValue: YooptaContentValue,
    options: YooptaOnChangeOptions
  ) => {
    setValue(newValue);
    onChange?.(newValue, options);
  };

  // Set initial editor state if provided
  useEffect(() => {
    if (editorState && Object.keys(editorState).length > 0) {
      editor.withoutSavingHistory(() => {
        editor.setEditorValue(editorState);
      });
    }
  }, [editor, editorState]);

  return (
    <div className={cn("border rounded-md", className)} ref={selectionRef}>
      <YooptaEditor
        editor={editor}
        plugins={PLUGINS}
        marks={MARKS}
        tools={TOOLS}
        autoFocus={autoFocus}
        readOnly={!editable}
        placeholder={placeholder}
        style={EDITOR_STYLE}
        value={value}
        onChange={handleChange}
        selectionBoxRoot={selectionRef}
      />
    </div>
  );
}
