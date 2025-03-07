"use client";

import { useState } from "react";
import * as motion from "motion/react-client";import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload, FileWithPreview } from "@/components/file-upload";
import { YouTubeInput } from "@/components/youtube-input";
import { Editor } from "@/components/editor";
import { SerializedEditorState } from "lexical";
import { toast } from "sonner";
import { Link, FileText, Youtube, Pencil, Plus } from "lucide-react";

type SourceType = "file" | "youtube" | "link" | "note";

type SourceCreatorProps = {
  spaceId: string;
  onSourceCreated?: () => void;
  className?: string;
};

export function SourceCreator({
  spaceId,
  onSourceCreated,
  className,
}: SourceCreatorProps) {
  const [activeTab, setActiveTab] = useState<SourceType>("file");
  const [isCreating, setIsCreating] = useState(false);
  
  // File upload state
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  
  // YouTube link state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  // Web link state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  
  // Note state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState<SerializedEditorState | null>(null);

  const handleFilesUploaded = (uploadedFiles: FileWithPreview[]) => {
    setFiles(uploadedFiles);
  };

  const handleYoutubeSubmit = (url: string) => {
    setYoutubeUrl(url);
    return Promise.resolve(); // Simulate async operation
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkUrl) {
      toast.error("Please enter a URL");
      return;
    }
    
    if (!linkTitle) {
      toast.error("Please enter a title for the link");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Here you would call your API to save the link
      // await createSource({ type: "link", url: linkUrl, title: linkTitle, spaceId });
      
      toast.success("Link added successfully");
      setLinkUrl("");
      setLinkTitle("");
      onSourceCreated?.();
    } catch (error) {
      toast.error("Failed to add link");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteTitle) {
      toast.error("Please enter a title for the note");
      return;
    }
    
    if (!noteContent) {
      toast.error("Please add some content to your note");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Here you would call your API to save the note
      // await createSource({ type: "note", title: noteTitle, content: noteContent, spaceId });
      
      toast.success("Note added successfully");
      setNoteTitle("");
      setNoteContent(null);
      onSourceCreated?.();
    } catch (error) {
      toast.error("Failed to add note");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Here you would call your API to upload the files
      // const promises = files.map(file => uploadFile(file, spaceId));
      // await Promise.all(promises);
      
      toast.success(`${files.length} file(s) uploaded successfully`);
      setFiles([]);
      onSourceCreated?.();
    } catch (error) {
      toast.error("Failed to upload files");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const getTabIcon = (type: SourceType) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "link":
        return <Link className="h-4 w-4" />;
      case "note":
        return <Pencil className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <Tabs defaultValue="file" onValueChange={(value) => setActiveTab(value as SourceType)}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">File</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              <span className="hidden sm:inline">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            <TabsTrigger value="note" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Note</span>
            </TabsTrigger>
          </TabsList>
          
          <CardContent>
            <TabsContent value="file" className="mt-0">
              <div className="space-y-4">
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={5}
                  maxSize={20 * 1024 * 1024} // 20MB
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleFileSubmit}
                    disabled={isCreating || files.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Uploading..." : "Upload Files"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="youtube" className="mt-0">
              <div className="space-y-4">
                <YouTubeInput
                  onLinkSubmit={handleYoutubeSubmit}
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      if (!youtubeUrl) {
                        toast.error("Please enter a YouTube URL");
                        return;
                      }
                      
                      setIsCreating(true);
                      
                      // Simulate API call
                      setTimeout(() => {
                        toast.success("YouTube video added successfully");
                        setYoutubeUrl("");
                        setIsCreating(false);
                        onSourceCreated?.();
                      }, 1000);
                    }}
                    disabled={isCreating || !youtubeUrl}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Adding..." : "Add YouTube Video"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="link" className="mt-0">
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link-title">Title</Label>
                  <Input
                    id="link-title"
                    placeholder="Enter a title for this link"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={isCreating || !linkUrl || !linkTitle}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Adding..." : "Add Link"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="note" className="mt-0">
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    placeholder="Enter a title for this note"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <Editor
                    onChange={setNoteContent}
                    placeholder="Start writing your note..."
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={isCreating || !noteTitle}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Creating..." : "Create Note"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
