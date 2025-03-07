import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/data/spaces";
import { SourcesPanel } from "@/components/sources-panel";
import { NoteEditor } from "@/components/note-editor";
import { ChatPanel } from "@/components/chat-panel";

export default async function SpacePage({ params }: { params: { id: string } }) {
  const space = await getSpaceById(params.id);
  
  if (!space) {
    notFound();
  }
  
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-xl font-bold">{space.name}</h1>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Sources */}
        <div className="w-64 border-r overflow-y-auto p-4">
          <SourcesPanel spaceId={space.id} />
        </div>
        
        {/* Middle Column: Note Editor */}
        <div className="flex-1 overflow-y-auto">
          <NoteEditor spaceId={space.id} />
        </div>
        
        {/* Right Column: Chat */}
        <div className="w-80 border-l overflow-y-auto">
          <ChatPanel spaceId={space.id} />
        </div>
      </div>
    </div>
  );
} 