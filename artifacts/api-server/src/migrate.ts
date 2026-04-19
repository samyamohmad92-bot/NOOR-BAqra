import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("Running database migrations...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS supervisors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      country TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      tajweed_level TEXT DEFAULT 'beginner',
      supervisor_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS student_progress (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL UNIQUE,
      current_wajh INTEGER DEFAULT 1 NOT NULL,
      correct_count INTEGER DEFAULT 0 NOT NULL,
      current_session INTEGER DEFAULT 1 NOT NULL,
      total_stars INTEGER DEFAULT 0 NOT NULL,
      waiting_teacher BOOLEAN DEFAULT false NOT NULL,
      hashd_completed INTEGER DEFAULT 0 NOT NULL,
      test_attempts JSONB DEFAULT '{}' NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  // Seed default admin if not exists
  await db.execute(sql`
    INSERT INTO admins (phone, password)
    VALUES ('admin', 'admin123')
    ON CONFLICT (phone) DO NOTHING;
  `);

  // Seed default supervisor if not exists
  await db.execute(sql`
    INSERT INTO supervisors (name, phone, password)
    VALUES ('مشرف تجريبي', '0500000000', '123456')
    ON CONFLICT (phone) DO NOTHING;
  `);

  console.log("Migrations complete.");
}
