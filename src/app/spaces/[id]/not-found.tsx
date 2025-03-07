import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SpaceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Space Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The knowledge space you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
} 