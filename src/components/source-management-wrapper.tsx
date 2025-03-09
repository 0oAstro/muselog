"use client";

import { SourceManagement } from "@/components/source-management";
import type { Source } from "@prisma/client";

export function SourceManagementWrapper({ sources }: { sources: Source[] }) {
  const handleSourcesSelect = (selectedSources: string[]) => {
    console.log("Selected sources:", selectedSources);
  };

  return (
    <SourceManagement sources={sources} onSourcesSelect={handleSourcesSelect} />
  );
}
