import { relations } from "drizzle-orm";
import { linkClicks } from "./link-clicks";
import { linksShorted } from "./links-shorted";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
  links: many(linksShorted),
}));

export const linksShortedRelations = relations(linksShorted, ({ one, many }) => ({
  creator: one(users, { fields: [linksShorted.createdBy], references: [users.id] }),
  clicks: many(linkClicks),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(linksShorted, { fields: [linkClicks.linkId], references: [linksShorted.id] }),
}));
