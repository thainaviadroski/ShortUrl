import type { Metadata } from "next";
import Link from "next/link";
import { LinkBreakIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Short URL | Page not found",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 border border-border p-8 text-center">
        <LinkBreakIcon className="size-10 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">404 — Page not found</h1>
          <p className="text-xs text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back home
        </Button>
      </div>
    </div>
  );
}
