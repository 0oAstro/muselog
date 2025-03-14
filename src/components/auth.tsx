"use client";

import { useState, useEffect } from "react";
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
  autoDevLogin
} from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";

export function AuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Auto-login in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const login = async () => {
        try {
          await loginWithTestUser();
          toast.success("Auto-login", {
            description: "Logged in as test user",
          });
          router.push("/spaces");
          router.refresh();
        } catch (error) {
          console.error("Auto-login failed:", error);
        }
      };
      login();
    }
  }, [router]);

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
    <motion.div className="h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[360px] border-none shadow-lg dark:bg-zinc-900">
        <CardHeader className="space-y-1 pb-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center"
          >
            <Icons.logo className="h-7 w-7" />
          </motion.div>
        </CardHeader>
        <CardContent className="pb-3">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="signin" onClick={() => setAuthMode("signin")}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setAuthMode("signup")}>
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleEmailAuth} className="space-y-2">
                <div className="space-y-1.5">
                  <div className="grid gap-1">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      placeholder="email@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-8"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-8"
                    />
                  </div>
                </div>
                <motion.div
                  initial={false}
                  animate={isLoading ? { scale: 0.98 } : { scale: 1 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full pt-1"
                >
                  <Button 
                    type="submit" 
                    className="w-full h-8" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center text-sm"
                      >
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Signing in...
                      </motion.div>
                    ) : (
                      <span className="text-sm">Sign In</span>
                    )}
                  </Button>
                </motion.div>
            </form>
          </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      placeholder="email@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      placeholder="••••••••"
                      type="password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
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
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn("github")}
              disabled={isLoading}
            >
              <SiGithub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isLoading}
                onClick={handleTestUserLogin}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.user className="mr-2 h-4 w-4" />
                )}
                Test Account
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </CardFooter>
      </Card>
    </motion.div>
  );
}
