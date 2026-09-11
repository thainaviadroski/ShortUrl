import { z } from "zod/v4";
import { linksShorted } from "@/db/schema";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./base";

export const createLinkSchema = createInsertSchema(linksShorted, {
  linkOriginal: (schema) => schema.url({ message: "Informe uma URL válida" }),
  linkShort: (schema) => schema.min(3).max(10),
})
  .omit({
    id: true,
    created: true,
    qrCodeUrl: true,
  })
  .partial({
    linkShort: true,
    isActive: true,
  });

export const updateLinkSchema = createUpdateSchema(linksShorted, {
  linkOriginal: (schema) => schema.url({ message: "Informe uma URL válida" }),
  linkShort: (schema) => schema.min(3).max(10),
}).omit({
  id: true,
  created: true,
  qrCodeUrl: true,
});

export const linkSchema = createSelectSchema(linksShorted);

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type Link = z.infer<typeof linkSchema>;
