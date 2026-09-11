import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { linksShorted } from "./links-shorted";

export const linkClicks = pgTable("link_clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id")
    .notNull()
    .references(() => linksShorted.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  device: varchar("device", { length: 100 }),
  referer: text("referer"),
  country: varchar("country", { length: 2 }),
  city: varchar("city", { length: 100 }),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});
