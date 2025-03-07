"use client";

import Link from "next/link";
import { Suspense } from "react";
import { getAllSpaces } from "@/lib/data/spaces";
import { Space } from "@prisma/client";
import { SpacesSkeleton } from "@/components/skeletons/spaces-skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Individual space card with delay loading effect
const SpaceCard = ({ space, index }: { space: Space; index: number }) => {
  // Add a small animation delay based on the index for a staggered effect
  const animationDelay = `${index * 100}ms`;

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all bg-card"
      style={{
        animationDelay,
        opacity: 0,
        animation: `fadeIn 0.5s ease-out forwards ${animationDelay}`,
      }}
    >
      <h2 className="text-xl font-semibold mb-2">{space.name}</h2>
      <p className="text-muted-foreground text-sm mb-4">
        {space.description || "No description"}
      </p>
      <div className="text-xs text-muted-foreground">
        Updated {space.updatedAt.toLocaleDateString()}
      </div>
    </Link>
  );
};

// Component that loads and displays spaces
const SpacesList = async () => {
  const spaces = await getAllSpaces();

  if (spaces.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Plus className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No spaces yet</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Create your first space to start organizing your research materials
          and notes.
        </p>
        <Button asChild>
          <Link href="/spaces/new">Create Your First Space</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {spaces.map((space, index) => (
        <SpaceCard key={space.id} space={space} index={index} />
      ))}
    </>
  );
};

export default function SpacesPage() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Spaces</h1>
          <p className="text-muted-foreground">
            Manage and organize your research spaces
          </p>
        </div>
        <Button asChild>
          <Link href="/spaces/new">
            <Plus className="mr-2 h-4 w-4" />
            New Space
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Suspense fallback={<SpacesSkeleton count={6} />}>
          <SpacesList />
        </Suspense>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
