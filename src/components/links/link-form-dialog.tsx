"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createLinkSchema,
  updateLinkSchema,
  type Link,
} from "@/lib/validations/link-shorted";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface LinkFormValues {
  linkOriginal: string;
  linkShort: string;
  description: string;
  maxTimeValid: string;
  isActive: boolean;
}

function toDatetimeLocal(date: Date | null | undefined) {
  if (!date) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDefaultValues(link?: Link): LinkFormValues {
  return {
    linkOriginal: link?.linkOriginal ?? "",
    linkShort: link?.linkShort ?? "",
    description: link?.description ?? "",
    maxTimeValid: toDatetimeLocal(link?.maxTimeValid),
    isActive: link?.isActive ?? true,
  };
}

interface LinkFormDialogProps {
  link?: Link;
  triggerLabel: React.ReactNode;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
}

export function LinkFormDialog({
  link,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "sm",
}: LinkFormDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!link;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LinkFormValues>({ defaultValues: toDefaultValues(link) });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) reset(toDefaultValues(link));
  }

  async function onSubmit(values: LinkFormValues) {
    const payload = {
      linkOriginal: values.linkOriginal,
      linkShort: values.linkShort.trim() || undefined,
      description: values.description.trim() || null,
      maxTimeValid: values.maxTimeValid ? new Date(values.maxTimeValid) : null,
      isActive: values.isActive,
    };

    const schema = isEdit ? updateLinkSchema : createLinkSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LinkFormValues | undefined;
        if (field) setError(field, { message: issue.message });
      }
      return;
    }

    const response = await fetch(
      isEdit ? `/api/link/${link.id}` : "/api/link",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      }
    );

    if (!response.ok) {
      toast.error(isEdit ? "Failed to update link" : "Failed to create link");
      return;
    }

    toast.success(isEdit ? "Link updated" : "Link created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit link" : "New link"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkOriginal">Original URL</Label>
            <Input
              id="linkOriginal"
              type="url"
              placeholder="https://example.com/page"
              aria-invalid={!!errors.linkOriginal}
              {...register("linkOriginal", { required: "Required" })}
            />
            {errors.linkOriginal && (
              <p className="text-xs text-destructive">{errors.linkOriginal.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkShort">Short code</Label>
            <Input
              id="linkShort"
              placeholder="Auto-generated if left blank"
              aria-invalid={!!errors.linkShort}
              {...register("linkShort")}
            />
            {errors.linkShort && (
              <p className="text-xs text-destructive">{errors.linkShort.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxTimeValid">Expires at</Label>
            <Input
              id="maxTimeValid"
              type="datetime-local"
              aria-invalid={!!errors.maxTimeValid}
              {...register("maxTimeValid")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Create link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
