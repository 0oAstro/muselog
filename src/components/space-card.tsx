"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { format } from "date-fns";

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    backdrop?: string;
    tags?: string[];
    created_at: Date;
    updated_at: Date;
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position relative to card center (in -1 to 1 range)
    const xValue = (e.clientX - rect.left - width / 2) / (width / 2);
    const yValue = (e.clientY - rect.top - height / 2) / (height / 2);
    
    // Set rotation values (scaled down for subtle effect)
    x.set(yValue * 3);  // Inverted for natural tilt
    y.set(xValue * -3); // Inverted for natural tilt
    
    // Track mouse position for highlight effect
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    // Reset values on mouse leave
    x.set(0);
    y.set(0);
  };

  const bgGradient = useMotionTemplate`
    radial-gradient(
      circle at ${mouseX}px ${mouseY}px,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 40%
    )
  `;

  return (
    <Link href={`/spaces/${space.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
        style={{ x, y }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="h-full overflow-hidden transition-colors group relative border-muted bg-muted/40 dark:bg-zinc-900/40 hover:bg-muted dark:hover:bg-zinc-900/80">
          <motion.div 
            className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-0 transition duration-300 group-hover:opacity-100" 
            style={{ background: bgGradient }} 
          />
          {space.backdrop && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AspectRatio ratio={16 / 4} className="h-24 w-full">
                <div
                  className="h-full w-full bg-cover bg-center opacity-15"
                  style={{ backgroundImage: `url(${space.backdrop})` }}
                />
              </AspectRatio>
            </div>
          )}
          
          <div className="relative z-20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center rounded-md text-4xl">
                  {space.icon || "📚"}
                </div>
                <CardTitle className="line-clamp-1">{space.name}</CardTitle>
              </div>
              {space.description && (
                <CardDescription className="line-clamp-2">
                  {space.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {space.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="text-xs text-muted-foreground">
              Updated {format(new Date(space.updated_at), "PP")}
            </CardFooter>
          </div>
          
          <div className="absolute inset-0 -z-10 bg-[url('/noise.svg')] opacity-0 group-hover:opacity-20 transition-opacity" />
        </Card>
      </motion.div>
    </Link>
  );
} 