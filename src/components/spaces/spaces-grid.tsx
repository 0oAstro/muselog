"use client";

import Link from "next/link";
import { Space } from "@prisma/client";
import SpaceCard from "@/components/space-card";
import { useState, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteSpaces } from "@/lib/data/spaces";

// This is a proper client component
export default function SpacesGrid({ spaces }: { spaces: Space[] }) {
  // Add state for edit mode and selection
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Exit edit mode on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isEditMode) {
        setIsEditMode(false);
        setSelectedSpaces([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditMode]);

  // Create a mock space object for the "New Space" card
  const newSpaceCard: Space = {
    id: "new",
    name: "Create New Space",
    description: "Start a new collection for your notes, ideas, and more",
    updatedAt: new Date(), // Current date
    icon: "➕", // Plus icon
    tags: ["new"],
  };

  // Handle card selection in edit mode
  const handleSpaceClick = (spaceId: string, e: React.MouseEvent) => {
    if (!isEditMode || spaceId === "new") return;

    e.preventDefault(); // Prevent navigation when in edit mode

    setSelectedSpaces((prev) => {
      if (prev.includes(spaceId)) {
        return prev.filter((id) => id !== spaceId);
      } else {
        return [...prev, spaceId];
      }
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    setSelectedSpaces([]);
  };

  // Handle deletion of selected spaces
  const handleDelete = async () => {
    try {
      await deleteSpaces(selectedSpaces);
      setSelectedSpaces([]);
      setIsEditMode(false);
      setIsDialogOpen(false);
      window.location.reload(); // Refresh to see changes
    } catch (error) {
      console.error("Error deleting spaces:", error);
    }
  };

  return (
    <>
      {/* Create new space card - disabled during edit mode */}
      <div className={isEditMode ? "pointer-events-none opacity-50" : ""}>
        <Link href="/spaces/new" className="block h-full">
          <SpaceCard space={newSpaceCard} isCreateCard={true} />
        </Link>
      </div>

      {/* Existing spaces */}
      {spaces.map((space) => (
        <div
          key={space.id}
          className={`relative ${isEditMode ? "cursor-pointer" : ""} ${
            isEditMode && !selectedSpaces.includes(space.id)
              ? "shake-animation"
              : ""
          }`}
          onClick={(e) => handleSpaceClick(space.id, e)}
        >
          {isEditMode && (
            <div
              className={`absolute top-2 right-2 z-10 h-6 w-6 rounded-full border-2 ${
                selectedSpaces.includes(space.id)
                  ? "border-red-400 bg-red-400"
                  : "border-gray-300 bg-white"
              }`}
            ></div>
          )}
          <Link
            href={isEditMode ? "#" : `/spaces/${space.id}`}
            className="block h-full"
            onClick={(e) => isEditMode && e.preventDefault()}
          >
            <SpaceCard space={space} />
          </Link>
        </div>
      ))}

      {/* Floating edit/delete button */}
      <div className="fixed bottom-8 right-8 z-20">
        {isEditMode && selectedSpaces.length > 0 ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-12 w-12"
              >
                <Trash2 className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedSpaces.length}{" "}
                  selected space{selectedSpaces.length > 1 ? "s" : ""}? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            onClick={toggleEditMode}
            variant={isEditMode ? "secondary" : "default"}
            size="icon"
            className="rounded-full h-12 w-12"
          >
            {isEditMode ? (
              <X className="h-6 w-6" />
            ) : (
              <Pencil className="h-6 w-6" />
            )}
          </Button>
        )}
      </div>

      {/* Add shake animation style */}
      <style jsx global>{`
        @keyframes shake {
          0% {
            transform: translate(0.5px, 0.5px) rotate(0deg);
          }
          10% {
            transform: translate(-0.5px, -0.5px) rotate(-0.2deg);
          }
          20% {
            transform: translate(-0.7px, 0px) rotate(0.2deg);
          }
          30% {
            transform: translate(0.7px, 0.5px) rotate(0deg);
          }
          40% {
            transform: translate(0.5px, -0.5px) rotate(0.2deg);
          }
          50% {
            transform: translate(-0.5px, 0.5px) rotate(-0.2deg);
          }
          60% {
            transform: translate(-0.7px, 0px) rotate(0deg);
          }
          70% {
            transform: translate(0.7px, 0.5px) rotate(-0.2deg);
          }
          80% {
            transform: translate(-0.5px, -0.5px) rotate(0.2deg);
          }
          90% {
            transform: translate(0.5px, 0.5px) rotate(0deg);
          }
          100% {
            transform: translate(0.5px, -0.5px) rotate(-0.2deg);
          }
        }

        .shake-animation {
          animation: shake 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </>
  );
}
