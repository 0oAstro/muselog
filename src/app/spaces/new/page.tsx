"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as motion from "motion/react-client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { createSpace } from "@/lib/data/spaces";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { Space } from "@/lib/types";
import { EmojiPicker } from "@/components/emoji-picker";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  icon: z.string().max(2, "Icon must be a single emoji").optional(),
  tags: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const EMOJI_SUGGESTIONS = [
  "📚",
  "🔬",
  "💡",
  "🎯",
  "🌟",
  "📝",
  "🧠",
  "🔍",
  "📊",
  "🎨",
];

export default function NewSpacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("📚");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "📚",
      tags: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("You must be logged in to create a space");
      return;
    }

    setIsSubmitting(true);

    try {
      const newSpace: Space = await createSpace({
        ...data,
        userId: user.id,
        tags: [],
      });

      toast.success("Space created successfully!");

      // First refresh data in the background
      router.refresh();

      // Then redirect to the new space
      // Using replace instead of push for a cleaner navigation history
      router.replace(`/spaces/${newSpace.id}`);
    } catch (error: any) {
      toast.error("Failed to create space", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create New Space</h1>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Space Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <div className="space-y-3">
                        {/* Add emoji picker */}
                        <div className="flex items-center gap-2">
                          <EmojiPicker
                            value={field.value}
                            onChange={field.onChange}
                            buttonVariant="ghost"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click to select any emoji
                          </p>
                        </div>

                        {/* Quick suggestions */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Quick suggestions:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {EMOJI_SUGGESTIONS.map((emoji) => (
                              <Button
                                key={emoji}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "text-lg border-muted-foreground/20",
                                  field.value === emoji &&
                                    "border-primary bg-primary/15"
                                )}
                                onClick={() => {
                                  field.onChange(emoji);
                                  setSelectedEmoji(emoji);
                                }}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Research Space" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A space for my research on..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-border">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Space...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Space
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
