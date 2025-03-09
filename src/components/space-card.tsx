"use client";

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
import { Space } from "@/lib/types";
import { Plus } from "lucide-react";

interface SpaceCardProps {
  space: Space;
  isCreateCard?: boolean;
}

export default function SpaceCard({
  space,
  isCreateCard = false,
}: SpaceCardProps) {
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
    x.set(yValue * 3); // Inverted for natural tilt
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

  // Helper function to safely format dates
  const safelyFormatDate = (
    dateValue: string | number | Date | null | undefined
  ) => {
    if (!dateValue) return "Unknown date";

    try {
      const date = new Date(dateValue);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Unknown date";
      return format(date, "PP");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  return (
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
      <Card
        className={cn(
          "h-full overflow-hidden transition-colors group relative border-muted bg-muted/40 dark:bg-zinc-900/40 hover:bg-muted dark:hover:bg-zinc-900/80",
          isCreateCard && "border-dashed border-muted-foreground/50"
        )}
      >
        {!isCreateCard && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-0 transition duration-300 group-hover:opacity-100"
            style={{ background: bgGradient }}
          />
        )}

        {/* Only show backdrop for regular cards */}
        {!isCreateCard && space.backdrop && (
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
          {isCreateCard ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="bg-primary/20 p-4 rounded-full mb-2">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-base">New Space</p>
              <p className="text-xs text-muted-foreground mt-1 text-center px-4">
                Start a new collection for your notes and ideas
              </p>
            </div>
          ) : (
            <>
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
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="text-xs text-muted-foreground">
                Updated {safelyFormatDate(space.updatedAt || space.updatedAt)}
              </CardFooter>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
