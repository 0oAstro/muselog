"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as motion from "motion/react-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  loginWithTestUser,
} from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === "signin") {
        await signInWithEmail(email, password);
        toast.success("Success!", {
          description: "You have been signed in.",
        });
      } else {
        await signUpWithEmail(email, password);
        toast.success("Account created!", {
          description: "Please check your email to verify your account.",
        });
      }
      router.push("/");
      router.refresh();
    } catch (error: any) {
      const message = error?.message || "Something went wrong.";
      toast.error("Error", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true);

    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "github") {
        await signInWithGithub();
      }
    } catch (error: any) {
      const message = error?.message || "Something went wrong.";
      toast.error("Error", {
        description: message,
      });
      setIsLoading(false);
    }
  };

  const handleTestUserLogin = async () => {
    setIsLoading(true);

    try {
      await loginWithTestUser();
      toast.success("Test user login", {
        description: "You have been signed in as a test user.",
      });
      router.push("/");
      router.refresh();
    } catch (error: any) {
      const message = error?.message || "Something went wrong.";
      toast.error("Error", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-[450px] p-4 space-y-6"
    >
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Icons.logo className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Muselog
          </CardTitle>
          <CardDescription className="text-center">
            Your personal knowledge database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              {[
                { value: "signin", label: "Sign In" },
                { value: "signup", label: "Sign Up" },
              ].map((tab, i) => (
                <TabsTrigger
                  key={i}
                  value={tab.value}
                  onClick={() => setAuthMode(tab.value as "signin" | "signup")}
                  style={{ position: "relative" }}
                  className="data-[state=active]:bg-transparent"
                >
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {tab.label}
                  </span>
                  {tab.value === authMode && (
                    <motion.div
                      layoutId="tab-background"
                      className="absolute inset-0 bg-primary/10 rounded-md -z-0"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="email"
                    placeholder="Email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    id="password"
                    placeholder="Password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="email"
                    placeholder="Email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    id="password"
                    placeholder="Password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-card text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn("github")}
              disabled={isLoading}
              className="h-11"
            >
              <Icons.github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className="h-11"
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            onClick={handleTestUserLogin}
            disabled={isLoading}
            className="w-full text-sm text-muted-foreground hover:text-primary"
          >
            Continue as Test User
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
