import { z } from "zod/v4";
import { linkClicks } from "@/db/schema";
import { createInsertSchema, createSelectSchema } from "./base";

export const createLinkClickSchema = createInsertSchema(linkClicks).omit({
  id: true,
  clickedAt: true,
});

export const linkClickSchema = createSelectSchema(linkClicks);

export type CreateLinkClickInput = z.infer<typeof createLinkClickSchema>;
export type LinkClick = z.infer<typeof linkClickSchema>;
