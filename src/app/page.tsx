import { AppShell } from "@/components/app-shell";
import { SpaceCard } from "@/components/space-card";
import { Space } from "@/lib/data/spaces";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

async function getSpaces(): Promise<Space[]> {
  try {
    // In a real app, we would get this from Prisma
    // Since we're not connected to a database, we'll return mock data
    return [
      {
        id: "space-1",
        name: "Machine Learning",
        description: "Notes and resources about machine learning algorithms and techniques",
        icon: "🧠",
        backdrop: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop",
        tags: ["AI", "ML", "Data Science"],
        created_at: new Date("2023-01-15"),
        updated_at: new Date("2023-03-20"),
      },
      {
        id: "space-2",
        name: "Web Development",
        description: "Frontend and backend web development resources",
        icon: "🌐",
        backdrop: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&auto=format&fit=crop",
        tags: ["React", "Next.js", "TypeScript"],
        created_at: new Date("2023-02-10"),
        updated_at: new Date("2023-04-05"),
      },
      {
        id: "space-3",
        name: "Book Notes",
        description: "Notes from books I've read",
        icon: "📚",
        backdrop: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=800&auto=format&fit=crop",
        tags: ["Books", "Reading", "Notes"],
        created_at: new Date("2023-03-22"),
        updated_at: new Date("2023-05-18"),
      },
    ];
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
}

export default async function Home() {
  const spaces = await getSpaces();

  return (
    <AppShell>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Your Spaces</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your knowledge spaces
            </p>
          </div>
          <Button asChild>
            <Link href="/create-space" className="flex items-center">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Space
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
