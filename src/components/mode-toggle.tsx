"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/switch";

function noopSubscribe() {
  return () => {};
}

// next-themes only knows the real theme on the client, so the server render (and the
// client's hydration pass) must report "not mounted" to match; useSyncExternalStore's
// server snapshot keeps that stable and flips to true right after hydration commits.
function useHasMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hasMounted = useHasMounted();
  const isDark = hasMounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1.5">
      <Sun className="size-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      <Moon className="size-4 text-muted-foreground" />
    </div>
  );
}
