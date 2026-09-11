import { relations } from "drizzle-orm";
import { linkClicks } from "./link-clicks";
import { linksShorted } from "./links-shorted";

export const linksShortedRelations = relations(linksShorted, ({ many }) => ({
  clicks: many(linkClicks),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(linksShorted, { fields: [linkClicks.linkId], references: [linksShorted.id] }),
}));
