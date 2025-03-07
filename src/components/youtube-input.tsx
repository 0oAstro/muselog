"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube } from "lucide-react";
import { toast } from "sonner";
import * as motion from "motion/react-client";
type YouTubeInputProps = {
  onLinkSubmit: (youtubeUrl: string) => void;
  className?: string;
};

export function YouTubeInput({ onLinkSubmit, className }: YouTubeInputProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    // Basic validation for YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setIsLoading(true);
    try {
      await onLinkSubmit(youtubeUrl);
      setYoutubeUrl("");
      toast.success("YouTube link added successfully");
    } catch (error) {
      toast.error("Failed to add YouTube link");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Youtube className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Paste YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading || !youtubeUrl}>
          {isLoading ? "Adding..." : "Add"}
        </Button>
      </form>
    </motion.div>
  );
}
