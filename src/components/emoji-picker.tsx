"use client";

import { useState } from "react";
import { EmojiPicker as Picker } from "@ferrucc-io/emoji-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onChange: (emoji: string) => void;
  value?: string;
  className?: string;
  buttonVariant?: "default" | "outline" | "ghost";
}

export function EmojiPicker({
  onChange,
  value,
  className,
  buttonVariant = "outline",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          size="icon"
          className={cn("h-10 w-10 text-xl", className)}
        >
          {value || "🔍"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" align="start">
        <Picker 
          className="font-['Lato'] w-[300px] border-none"
          emojisPerRow={9}
          emojiSize={36}
          onEmojiSelect={handleSelect}
        >
          <Picker.Header>
            <Picker.Input 
              placeholder="Search all emoji" 
              className="h-[36px] bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 w-full rounded-[8px] text-[15px] focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] dark:focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] focus:border-transparent focus:outline-none mb-1"
              hideIcon
            />
          </Picker.Header>
          <Picker.Group>
            <Picker.List containerHeight={320} />          
          </Picker.Group>
          <Picker.Preview>
            {({ previewedEmoji }) => (
              <>
                {previewedEmoji ? 
                  <Picker.Content />
                  :
                  <button className="text-sm p-2 text-zinc-500 dark:text-zinc-400">
                    Add Emoji
                  </button>
                }
                <Picker.SkinTone />
              </>
            )}
          </Picker.Preview>
        </Picker>
      </PopoverContent>
    </Popover>
  );
} 