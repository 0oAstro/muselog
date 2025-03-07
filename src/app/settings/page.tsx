import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Work in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
              <Settings className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              Settings Page Under Development
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-2">
              We're currently building this settings page to help you customize
              your experience.
            </p>
            <p className="text-muted-foreground text-center">
              Check back soon for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
