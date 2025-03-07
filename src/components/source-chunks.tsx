"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Chunk {
  id: string;
  content: string;
  metadata?: {
    page?: number;
    startTime?: number;
    endTime?: number;
    [key: string]: any;
  };
  tags?: string[];
}

interface SourceChunksProps {
  chunks: Chunk[];
  onTagsChange?: (chunkId: string, tags: string[]) => void;
}

export function SourceChunks({ chunks, onTagsChange }: SourceChunksProps) {
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  const toggleChunk = (chunkId: string) => {
    setExpandedChunks((prev) => ({
      ...prev,
      [chunkId]: !prev[chunkId],
    }));
  };

  const copyChunkContent = async (chunkId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedChunkId(chunkId);
      toast.success("Chunk content copied to clipboard");
      
      setTimeout(() => {
        setCopiedChunkId(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const formatMetadata = (metadata?: Chunk["metadata"]) => {
    if (!metadata) return null;
    
    const items = [];
    
    if (metadata.page !== undefined) {
      items.push(`Page ${metadata.page}`);
    }
    
    if (metadata.startTime !== undefined && metadata.endTime !== undefined) {
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
      
      items.push(`${formatTime(metadata.startTime)} - ${formatTime(metadata.endTime)}`);
    }
    
    return items.length > 0 ? items.join(" • ") : null;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Source Chunks</h3>
      
      {chunks.length === 0 ? (
        <p className="text-muted-foreground">No chunks available for this source.</p>
      ) : (
        <div className="space-y-4">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="border rounded-md overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
                onClick={() => toggleChunk(chunk.id)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {chunk.content.substring(0, 50)}...
                    </span>
                    {chunk.tags && chunk.tags.length > 0 && (
                      <div className="flex gap-1">
                        {chunk.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {formatMetadata(chunk.metadata) && (
                    <span className="text-xs text-muted-foreground">
                      {formatMetadata(chunk.metadata)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyChunkContent(chunk.id, chunk.content);
                    }}
                  >
                    {copiedChunkId === chunk.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedChunks[chunk.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              {expandedChunks[chunk.id] && (
                <div className="p-3 border-t">
                  <pre className="whitespace-pre-wrap text-sm">{chunk.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 