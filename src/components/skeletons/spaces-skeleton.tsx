import React from "react";
import { cn } from "@/lib/utils";

interface SpacesSkeletonProps {
  count?: number;
  className?: string;
}

export function SpacesSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg p-6 bg-card", className)}>
      <div className="h-6 bg-muted rounded-md w-3/4 mb-3 animate-pulse"></div>
      <div className="h-4 bg-muted rounded-md w-full mb-2 animate-pulse"></div>
      <div className="h-4 bg-muted rounded-md w-5/6 mb-4 animate-pulse"></div>
      <div className="h-3 bg-muted rounded-md w-1/3 animate-pulse"></div>
    </div>
  );
}

export function SpacesSkeleton({ count = 3, className }: SpacesSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SpacesSkeletonCard key={index} />
      ))}
    </div>
  );
}
