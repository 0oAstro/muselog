"use client";

import { useState, useEffect } from "react";
import { PlusIcon, Heading1, Heading2, Code, Image, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NoteEditorProps {
  spaceId: string;
}

interface Block {
  id: string;
  type: "paragraph" | "heading1" | "heading2" | "code" | "image";
  content: string;
}

// Mock data for initial blocks
const initialBlocks: Block[] = [
  {
    id: "block-1",
    type: "heading1",
    content: "My Knowledge Notes",
  },
  {
    id: "block-2",
    type: "paragraph",
    content:
      "This is a note-taking area where you can organize your thoughts and knowledge. You can add different types of blocks like headings, paragraphs, code snippets, and images.",
  },
  {
    id: "block-3",
    type: "heading2",
    content: "Getting Started",
  },
  {
    id: "block-4",
    type: "paragraph",
    content:
      "Click the + button below to add new blocks. You can also rearrange blocks by dragging them.",
  },
  {
    id: "block-5",
    type: "code",
    content: "// Example code block\nfunction hello() {\n  console.log('Hello, world!');\n}",
  },
];

export function NoteEditor({ spaceId }: NoteEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [noteId, setNoteId] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch the note from the API
    const loadNote = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBlocks(initialBlocks);
      setNoteId("note-1");
    };

    loadNote();
  }, [spaceId]);

  const addBlock = (type: Block["type"] = "paragraph") => {
    setBlocks([
      ...blocks,
      { id: `block-${Date.now()}`, type, content: "" },
    ]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(
      blocks.map((block) => (block.id === id ? { ...block, content } : block))
    );
  };

  const deleteBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter((block) => block.id !== id));
    }
  };

  const saveNote = async () => {
    try {
      // In a real app, this would be an API call to save the note
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success("Your note has been saved successfully.");
    } catch (error) {
      toast.error("There was an error saving your note.");
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <Button onClick={saveNote} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-3 min-h-[200px]">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-card rounded-md shadow-sm transition-all hover:shadow-md"
            >
              {block.type === "paragraph" && (
                <div className="p-3 border rounded-md">
                  <textarea
                    className="w-full bg-transparent resize-none outline-none min-h-[100px]"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Type your text here..."
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {block.type === "heading1" && (
                <div className="p-3 border rounded-md">
                  <input
                    className="w-full bg-transparent outline-none text-2xl font-bold"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Heading 1"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {block.type === "heading2" && (
                <div className="p-3 border rounded-md">
                  <input
                    className="w-full bg-transparent outline-none text-xl font-semibold"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Heading 2"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {block.type === "code" && (
                <div className="p-3 border rounded-md">
                  <pre className="bg-secondary/50 p-2 rounded-md">
                    <code>
                      <textarea
                        className="w-full bg-transparent resize-none outline-none font-mono text-sm"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e.target.value)}
                        placeholder="// Code block"
                      />
                    </code>
                  </pre>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {block.type === "image" && (
                <div className="p-3 border rounded-md">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-secondary/30 w-full h-40 flex items-center justify-center rounded-md">
                      {block.content ? (
                        <img
                          src={block.content}
                          alt="User uploaded"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Image className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      className="w-full bg-transparent outline-none text-sm"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      placeholder="Paste image URL here..."
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t pt-4">
        <Button
          onClick={() => addBlock("paragraph")}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Text
        </Button>
        <Button
          onClick={() => addBlock("heading1")}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Heading1 className="w-4 h-4" /> H1
        </Button>
        <Button
          onClick={() => addBlock("heading2")}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Heading2 className="w-4 h-4" /> H2
        </Button>
        <Button
          onClick={() => addBlock("code")}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Code className="w-4 h-4" /> Code
        </Button>
        <Button
          onClick={() => addBlock("image")}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Image className="w-4 h-4" /> Image
        </Button>
      </div>
    </div>
  );
} 