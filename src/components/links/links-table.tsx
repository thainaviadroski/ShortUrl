"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChartLineIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import type { Link } from "@/lib/validations/link-shorted";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkFormDialog } from "@/components/links/link-form-dialog";
import { FormattedDate } from "@/components/formatted-date";

export function LinksTable({ links }: { links: Link[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(link: Link) {
    if (!window.confirm(`Delete short link "${link.linkShort}"?`)) return;

    setDeletingId(link.id);
    const response = await fetch(`/api/link/${link.id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!response.ok) {
      toast.error("Failed to delete link");
      return;
    }

    toast.success("Link deleted");
    router.refresh();
  }

  if (links.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-muted-foreground">
        No links yet. Create your first short link to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Short</TableHead>
          <TableHead>Original URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            <TableCell className="font-medium">{link.id}</TableCell>
            <TableCell className="font-medium">
              <a
                href={"https://ex.io/" + link.linkShort}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                {"https://ex.io/" + link.linkShort}
              </a>
            </TableCell>
            <TableCell className="max-w-xs truncate" title={link.linkOriginal}>
              {link.linkOriginal}
            </TableCell>
            <TableCell>
              <Badge
                className={cn(
                  "rounded border",
                  link.isActive
                    ? "bg-green-500/10 text-green-600 border-green-500 dark:bg-green-500/20 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 border-red-700 dark:bg-red-500/20 dark:text-red-400",
                )}
              >
                {link.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <FormattedDate date={new Date(link.created)} />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="View link details"
                  tooltip="View link details"
                  nativeButton={false}
                  render={<NextLink href={`/links/${link.id}`} />}
                >
                  <ChartLineIcon className="size-4" />
                </Button>
                <LinkFormDialog
                  link={link}
                  triggerVariant="ghost"
                  triggerSize="icon-sm"
                  triggerLabel={<PencilSimpleIcon className="size-4" />}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete link"
                  tooltip="Delete link"
                  disabled={deletingId === link.id}
                  onClick={() => handleDelete(link)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
