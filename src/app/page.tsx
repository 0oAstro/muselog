import { redirect } from "next/navigation";
import { getCurrentUser, autoDevLogin } from "@/lib/auth";
import { AuthForm } from "@/components/auth";

export default async function Home() {
  autoDevLogin();
  // Check if user is authenticated
  const user = await getCurrentUser();
  console.log("Logged in as User:", user);

  if (user) {
    redirect("/spaces");
  } else {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <AuthForm />
        </div>
      </div>
    );
  }
}
