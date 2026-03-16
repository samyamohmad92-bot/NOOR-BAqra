import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  country: text("country").default(""),
  gender: text("gender").default(""),
  tajweedLevel: text("tajweed_level").default("beginner"),
  supervisorId: integer("supervisor_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentProgressTable = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().unique(),
  currentWajh: integer("current_wajh").default(1).notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  currentSession: integer("current_session").default(1).notNull(),
  totalStars: integer("total_stars").default(0).notNull(),
  waitingTeacher: boolean("waiting_teacher").default(false).notNull(),
  hashdCompleted: integer("hashd_completed").default(0).notNull(),
  testAttempts: jsonb("test_attempts").default({}).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(studentProgressTable).omit({ id: true, updatedAt: true });

export type Student = typeof studentsTable.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type StudentProgress = typeof studentProgressTable.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
