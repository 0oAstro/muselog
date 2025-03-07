import { redirect } from "next/navigation";
import * as motion from "motion/react-client";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth";
import { toast } from "sonner";

export default async function Home() {
  // In development mode, always redirect to spaces
  if (process.env.NODE_ENV === 'development') {
    redirect("/spaces");
    return null;
  }

  // Check if user is authenticated
  const user = await getCurrentUser();
  if (user) {
    redirect("/spaces");
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <AuthForm />
    </div>
  );
}
