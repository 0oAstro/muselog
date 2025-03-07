"use client";

import { useState } from "react";
import { Plus, File, FileText, Image, Youtube, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SourcesPanelProps {
  spaceId: string;
}

// Mock data for sources
const mockSources = [
  {
    id: "source-1",
    name: "Introduction to Machine Learning.pdf",
    type: "pdf",
    thumbnail: "https://placehold.co/100x140/e63946/ffffff?text=PDF",
  },
  {
    id: "source-2",
    name: "Neural Networks Explained",
    type: "youtube",
    thumbnail: "https://placehold.co/100x60/0a9396/ffffff?text=YouTube",
  },
  {
    id: "source-3",
    name: "Data Visualization Techniques.png",
    type: "image",
    thumbnail: "https://placehold.co/100x100/ee9b00/ffffff?text=IMG",
  },
];

export function SourcesPanel({ spaceId }: SourcesPanelProps) {
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    setIsLoading(true);

    try {
      // In a real app, this would be an API call to process the YouTube video
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("YouTube video has been added to your space");

      setIsAddSourceOpen(false);
      setYoutubeUrl("");
    } catch (error) {
      toast.error("Failed to add YouTube video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // In a real app, this would be an API call to upload and process the file
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(`${file.name} has been uploaded and processed`);

      setIsAddSourceOpen(false);
    } catch (error) {
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sources</h2>
        <Dialog open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Source</DialogTitle>
              <DialogDescription>
                Add a new source to your knowledge space
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.mp3,.mp4"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, Images, Audio, Video
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <form onSubmit={handleAddYouTube}>
                <div className="grid gap-2">
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !youtubeUrl}>
                      Add
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 overflow-y-auto">
        {mockSources.map((source) => (
          <div
            key={source.id}
            className="flex gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="shrink-0">
              {source.type === "pdf" && (
                <FileText className="h-10 w-10 text-red-500" />
              )}
              {source.type === "youtube" && (
                <Youtube className="h-10 w-10 text-red-600" />
              )}
              {source.type === "image" && (
                <Image className="h-10 w-10 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{source.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {source.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 