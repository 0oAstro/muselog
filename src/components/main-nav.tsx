"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 flex items-center space-x-4">
      <Link href="/" className="flex items-center space-x-2">
        <BookOpen className="h-6 w-6" />
        <span className="font-bold">Muselog</span>
      </Link>
      
      <nav className="flex items-center space-x-4 lg:space-x-6">
        <Link
          href="/"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Spaces
        </Link>
        <Link
          href="/explore"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/explore"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          Explore
        </Link>
        <Link
          href="/settings"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/settings"
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          Settings
        </Link>
      </nav>
      
      <div className="ml-auto">
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </div>
  );
} 