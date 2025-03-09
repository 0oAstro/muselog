import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication methods
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Redirect after successful sign in
  if (typeof window !== "undefined") {
    window.location.href = "/spaces";
  }

  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  // Redirect after successful sign up if session exists
  if (data.session && typeof window !== "undefined") {
    window.location.href = "/spaces";
  }

  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithGithub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const loginWithTestUser = async () => {
  try {
    // First attempt to log in with the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password123",
    });

    if (error) throw error;

    // Redirect after successful login
    if (typeof window !== "undefined") {
      window.location.href = "/spaces";
    }

    return data;
  } catch (error) {
    console.error("Error logging in with test user:", error);
    // If login fails, try to create a test user
    await createTestUser();

    // Try logging in again after creating
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "password123",
      });

      if (error) throw error;
      return data;
    } catch (loginError) {
      console.error("Failed to login after creating test user:", loginError);
      throw loginError;
    }
  }
};

// Create test user if it doesn't exist
const createTestUser = async () => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "password123",
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating test user:", error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Get current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// Create auth callback handler for OAuth providers
export const handleAuthCallback = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  // Redirect after successful OAuth callback
  if (session && typeof window !== "undefined") {
    window.location.href = "/spaces";
  }

  return session;
};

// Helper function to enable development bypass
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

// Automatically log in with test user in development mode
export const autoDevLogin = async () => {
  if (isDevelopment()) {
    try {
      return await loginWithTestUser();
    } catch (error) {
      console.error("Auto dev login failed:", error);
      return null;
    }
  }
  return null;
};
