"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import { Plus, Settings, LogOut, Moon, Sun, Laptop } from "lucide-react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error signing out");
    }
  };
  
  const getUserInitials = (user: User | null) => {
    if (!user || !user.email) return "U";
    
    const email = user.email;
    const emailName = email.split("@")[0];
    
    if (emailName.includes(".")) {
      const parts = emailName.split(".");
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return emailName[0].toUpperCase();
  };
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 w-full border-b bg-background"
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">Muselog</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {!isLoading && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/spaces/new")} 
                className="hidden sm:flex"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Space
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || ""} 
                          alt={user.email || "User"} 
                        />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("light")}
                      className={cn(theme === "light" && "bg-accent")}
                    >
                      <Sun className="mr-2 h-4 w-4" /> Light
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("dark")}
                      className={cn(theme === "dark" && "bg-accent")}
                    >
                      <Moon className="mr-2 h-4 w-4" /> Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("system")}
                      className={cn(theme === "system" && "bg-accent")}
                    >
                      <Laptop className="mr-2 h-4 w-4" /> System
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
} 