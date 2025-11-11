"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed top-4 right-16 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{user.email}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        title="Se déconnecter"
        className="h-8 w-8"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
