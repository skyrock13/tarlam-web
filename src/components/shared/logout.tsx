// src/components/shared/logout.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useSupabase } from "@/providers/supabase-provider";
import { useRouter } from "next/navigation"; // Use next/navigation

export default function LogoutButton() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      // Handle the error appropriately, e.g., show an error message to the user.
    } else {
      // Redirect to the login page (or home page) after successful logout.
      router.push('/login'); // Use router.push for client-side navigation
    }
  };

  return (
    <Button onClick={handleLogout} variant="destructive"> {/* Use a destructive variant */}
      Log Out
    </Button>
  );
}