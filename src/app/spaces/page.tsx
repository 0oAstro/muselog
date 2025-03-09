import { getAllSpaces } from "@/lib/data/spaces";
import SpacesGrid from "@/components/spaces/spaces-grid";

// This is now a proper server component
export default async function SpacesPage() {
  const spaces = await getAllSpaces();

  return (
    <div className="spaces-page grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      <SpacesGrid spaces={spaces} />
    </div>
  );
}
