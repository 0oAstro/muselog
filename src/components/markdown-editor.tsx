"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function MarkdownEditor({
  initialContent = "",
  onSave,
  placeholder = "Write your markdown here...",
  readOnly = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<string>("edit");

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    if (onSave) {
      onSave(content);
      toast.success("Content saved successfully");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <Button onClick={handleSave} size="sm" className="gap-1">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          
          <TabsContent value="edit" className="flex-1 mt-0">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="min-h-[300px] h-full font-mono resize-none"
              disabled={readOnly}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 mt-0">
            <div className="border rounded-md p-4 min-h-[300px] h-full overflow-y-auto prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
              >
                {content || "*No content*"}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {readOnly && (
        <div className="border rounded-md p-4 min-h-[300px] h-full overflow-y-auto prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {content || "*No content*"}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
} 