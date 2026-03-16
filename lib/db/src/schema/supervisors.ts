import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supervisorsTable = pgTable("supervisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupervisorSchema = createInsertSchema(supervisorsTable).omit({ id: true, createdAt: true });

export type Supervisor = typeof supervisorsTable.$inferSelect;
export type InsertSupervisor = z.infer<typeof insertSupervisorSchema>;
