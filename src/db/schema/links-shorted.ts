import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const linksShorted = pgTable("links_shorted", {
  id: serial("id").primaryKey(),
  linkOriginal: text("link_original").notNull(),
  linkShort: varchar("link_short", { length: 10 }).notNull().unique(),
  maxTimeValid: timestamp("max_time_valid"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  qrCodeUrl: text("qr_code_url"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created: timestamp("created").defaultNow().notNull(),
}, (table) => [
  index("links_shorted_created_by_idx").on(table.createdBy),
]);
