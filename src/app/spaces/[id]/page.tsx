import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpaceById } from "@/lib/data/spaces";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  MessageSquare,
  Settings,
  ArrowLeft,
  Tag,
  Search,
} from "lucide-react";
import { SourceCreator } from "@/components/source-creator";
import { SourceManagement } from "@/components/source-management";
import { Editor } from "@/components/editor";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { Space } from "@/lib/types";

import * as motion from "motion/react-client";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

// Create loading components for each section
const SourcesLoading = () => (
  <div className="h-full w-full flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
  </div>
);

const EditorLoading = () => (
  <div className="h-full w-full flex items-center justify-center p-12">
    <LoadingSpinner size="lg" />
  </div>
);

const ChatLoading = () => (
  <div className="h-full w-full flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
  </div>
);

// Mock data for sources until API is connected
const mockSources = [
  {
    id: "source-1",
    title: "Introduction to Machine Learning",
    type: "file" as const,
    tags: ["ML", "AI", "Introduction"],
    createdAt: new Date("2023-05-15"),
    updatedAt: new Date("2023-05-15"),
  },
  {
    id: "source-2",
    title: "Neural Networks Explained",
    type: "youtube" as const,
    tags: ["Neural Networks", "Deep Learning"],
    createdAt: new Date("2023-06-10"),
    updatedAt: new Date("2023-06-12"),
  },
  {
    id: "source-3",
    title: "Research Paper on Transformers",
    type: "link" as const,
    tags: ["Research", "Transformers", "NLP"],
    createdAt: new Date("2023-07-05"),
    updatedAt: new Date("2023-07-05"),
  },
  {
    id: "source-4",
    title: "My thoughts on GPT-4",
    type: "note" as const,
    tags: ["GPT", "AI", "Personal"],
    createdAt: new Date("2023-08-20"),
    updatedAt: new Date("2023-08-22"),
  },
];

export default async function SpacePage({ params }: PageProps) {
  // Handle both synchronous and asynchronous params
  const id = params instanceof Promise ? (await params).id : params.id;

  try {
    // Fetch space data with proper error handling
    const space: Space = await getSpaceById(id);

    if (!space) {
      notFound();
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col"
      >
        <header className="border-b px-6 py-4 flex items-center justify-between bg-background sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/spaces">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {space.icon && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">{space.icon}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{space.name}</h1>
                {space.description && (
                  <p className="text-sm text-muted-foreground">
                    {space.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 container mx-auto py-6 px-4">
          <Tabs defaultValue="sources" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger
                  value="sources"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Sources & Notes
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in space..."
                  className="pl-9 w-full md:w-[300px]"
                />
              </div>
            </div>

            <TabsContent value="sources" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Source Creator */}
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Add Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<SourcesLoading />}>
                        <SourceCreator spaceId={space.id} />
                      </Suspense>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Popular Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Research",
                          "Notes",
                          "Papers",
                          "Videos",
                          "Articles",
                        ].map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Source Management */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<SourcesLoading />}>
                        <SourceManagement
                          sources={mockSources}
                          onSourcesSelect={(selectedSources) => {
                            console.log("Selected sources:", selectedSources);
                          }}
                        />
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<EditorLoading />}>
                    <Editor
                      placeholder="Start writing your notes..."
                      className="min-h-[400px]"
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="h-[calc(100vh-12rem)]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-5rem)] flex items-center justify-center">
                  <Suspense fallback={<ChatLoading />}>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        Chat with your space
                      </h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        Ask questions about your sources and notes. The AI
                        assistant will help you find information and generate
                        insights.
                      </p>
                      <Button size="lg">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Chat
                      </Button>
                    </div>
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    );
  } catch (error) {
    // Handle UUID validation errors specifically
    if (error instanceof Error && error.message.includes("invalid character")) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <h2 className="text-xl font-bold text-destructive">
              Invalid Space ID
            </h2>
            <p className="mt-2 text-muted-foreground">
              The space ID format is invalid. Please check the URL and try
              again.
            </p>
          </div>
        </div>
      );
    }

    // Handle other errors
    throw error;
  }
}
