"use client";

import { useState, useEffect } from "react";
import * as motion from "motion/react-client";import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Source = {
  id: string;
  title: string;
  type: "file" | "youtube" | "link" | "note";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type SourceManagementProps = {
  sources: Source[];
  onSourcesSelect: (selectedSources: string[]) => void;
  className?: string;
};

export function SourceManagement({
  sources,
  onSourcesSelect,
  className,
}: SourceManagementProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredSources, setFilteredSources] = useState<Source[]>(sources);
  const [searchQuery, setSearchQuery] = useState("");

  // Extract all unique tags from sources
  const allTags = Array.from(
    new Set(sources.flatMap((source) => source.tags))
  ).sort();

  // Filter sources based on selected tags and search query
  useEffect(() => {
    let filtered = [...sources];

    // Filter by selected tags if any
    if (selectedTags.length > 0) {
      filtered = filtered.filter((source) =>
        selectedTags.some((tag) => source.tags.includes(tag))
      );
    }

    // Filter by search query if any
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((source) =>
        source.title.toLowerCase().includes(query)
      );
    }

    setFilteredSources(filtered);
  }, [sources, selectedTags, searchQuery]);

  // Update parent component when selection changes
  useEffect(() => {
    onSourcesSelect(selectedSources);
  }, [selectedSources, onSourcesSelect]);

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilter = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSearchQuery("");
  };

  const selectAllSources = () => {
    setSelectedSources(filteredSources.map((source) => source.id));
  };

  const clearSourceSelection = () => {
    setSelectedSources([]);
  };

  const getSourceTypeIcon = (type: Source["type"]) => {
    switch (type) {
      case "file":
        return "📄";
      case "youtube":
        return "🎬";
      case "link":
        return "🔗";
      case "note":
        return "📝";
      default:
        return "📄";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sources</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            disabled={selectedTags.length === 0 && !searchQuery}
          >
            Clear filters
          </Button>
          {selectedSources.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSourceSelection}
            >
              Clear selection ({selectedSources.length})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllSources}
              disabled={filteredSources.length === 0}
            >
              Select all
            </Button>
          )}
        </div>
      </div>

      {/* Search and tag filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between">
              <Tag className="mr-2 h-4 w-4" />
              <span>Filter by tags</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {allTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      onSelect={() => handleTagSelect(tag)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{tag}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => clearTagFilter(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Sources list */}
      <div className="border rounded-md divide-y">
        {filteredSources.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No sources found.
          </div>
        ) : (
          filteredSources.map((source, index) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center p-3 hover:bg-muted/50"
            >
              <Checkbox
                id={`source-${source.id}`}
                checked={selectedSources.includes(source.id)}
                onCheckedChange={() => handleSourceSelect(source.id)}
                className="mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSourceTypeIcon(source.type)}</span>
                  <label
                    htmlFor={`source-${source.id}`}
                    className="flex-1 font-medium cursor-pointer truncate"
                  >
                    {source.title}
                  </label>
                </div>
                {source.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {source.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground ml-2">
                {source.updatedAt.toLocaleDateString()}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
