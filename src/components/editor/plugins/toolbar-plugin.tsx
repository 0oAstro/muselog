"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import {
  $isHeadingNode,
  $createHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $createParagraphNode, $getNodeByKey } from "lexical";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Quote,
  Code,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isHeading1, setIsHeading1] = useState(false);
  const [isHeading2, setIsHeading2] = useState(false);
  const [isHeading3, setIsHeading3] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberList, setIsNumberList] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const node = selection.anchor.getNode();
      const parent = node.getParent();
      
      // Check for link
      setIsLink(false);
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      }

      // Check for headings
      setIsHeading1(false);
      setIsHeading2(false);
      setIsHeading3(false);
      
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      
      if ($isHeadingNode(element)) {
        const tag = element.getTag();
        setIsHeading1(tag === "h1");
        setIsHeading2(tag === "h2");
        setIsHeading3(tag === "h3");
      }

      // Check for lists
      setIsBulletList(false);
      setIsNumberList(false);
      
      const parentList = $isListNode(parent) ? parent : null;
      const parentListNode = $isListNode(node.getParent()) ? node.getParent() : null;
      
      if (parentList || parentListNode) {
        const listNode = parentList || parentListNode;
        const listType = (listNode as ListNode).getListType();
        setIsBulletList(listType === "bullet");
        setIsNumberList(listType === "number");
      }
    }
  }, []);

  useEffect(() => {
    return activeEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [activeEditor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      UNDO_COMMAND,
      () => {
        setCanUndo(editor.canUndo());
        setCanRedo(editor.canRedo());
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      REDO_COMMAND,
      () => {
        setCanUndo(editor.canUndo());
        setCanRedo(editor.canRedo());
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    setCanUndo(editor.canUndo());
    setCanRedo(editor.canRedo());
  }, [editor]);

  const formatHeading = (headingSize: HeadingTagType) => {
    if (
      (isHeading1 && headingSize === "h1") ||
      (isHeading2 && headingSize === "h2") ||
      (isHeading3 && headingSize === "h3")
    ) {
      // If already this heading type, convert to paragraph
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === "root"
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow();
          element.replace($createParagraphNode());
        }
      });
    } else {
      // Convert to specified heading
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === "root"
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow();
          element.replace($createHeadingNode(headingSize));
        }
      });
    }
  };

  return (
    <div className="border-b p-1 flex flex-wrap gap-1 items-center">
      <TooltipProvider>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isBold && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                }}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isItalic && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                }}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isUnderline && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                }}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isStrikethrough && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                }}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isHeading1 && "bg-muted")}
                onClick={() => formatHeading("h1")}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isHeading2 && "bg-muted")}
                onClick={() => formatHeading("h2")}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isHeading3 && "bg-muted")}
                onClick={() => formatHeading("h3")}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isBulletList && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                }}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isNumberList && "bg-muted")}
                onClick={() => {
                  activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                }}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isLink && "bg-muted")}
                onClick={() => {
                  if (isLink) {
                    activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                  } else {
                    activeEditor.dispatchCommand(
                      TOGGLE_LINK_COMMAND,
                      "https://"
                    );
                  }
                }}
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "quote");
                }}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
                }}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
                }}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  activeEditor.dispatchCommand(REDO_COMMAND, undefined);
                }}
                disabled={!canRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
