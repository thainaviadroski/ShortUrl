import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const linksShorted = pgTable("links_shorted", {
  id: serial("id").primaryKey(),
  linkOriginal: text("link_original").notNull(),
  linkShort: varchar("link_short", { length: 10 }).notNull().unique(),
  maxTimeValid: timestamp("max_time_valid"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  qrCodeUrl: text("qr_code_url"),
  created: timestamp("created").defaultNow().notNull(),
});
