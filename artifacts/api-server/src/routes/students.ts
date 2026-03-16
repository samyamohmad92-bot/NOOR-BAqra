import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, studentProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const students = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
  const studentsWithProgress = await Promise.all(students.map(async (s) => {
    const progress = await db.select().from(studentProgressTable)
      .where(eq(studentProgressTable.studentId, s.id))
      .limit(1);
    const { password: _pw, ...safe } = s;
    return { ...safe, progress: progress[0] || null };
  }));
  res.json(studentsWithProgress);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const students = await db.select().from(studentsTable).where(eq(studentsTable.id, id)).limit(1);
  if (!students.length) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }
  const progress = await db.select().from(studentProgressTable)
    .where(eq(studentProgressTable.studentId, id))
    .limit(1);
  const { password: _pw, ...safe } = students[0];
  res.json({ ...safe, progress: progress[0] || null });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, password, country, gender, tajweedLevel } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (password) updates.password = password;
  if (country !== undefined) updates.country = country;
  if (gender !== undefined) updates.gender = gender;
  if (tajweedLevel !== undefined) updates.tajweedLevel = tajweedLevel;

  const updated = await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id)).returning();
  if (!updated.length) {
    res.status(404).json({ error: "الطالب غير موجود" });
    return;
  }
  const { password: _pw, ...safe } = updated[0];
  res.json(safe);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(studentProgressTable).where(eq(studentProgressTable.studentId, id));
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.json({ success: true });
});

router.post("/:id/reset-password", async (req, res) => {
  const id = parseInt(req.params.id);
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let newPassword = '';
  for (let i = 0; i < 8; i++) newPassword += chars[Math.floor(Math.random() * chars.length)];

  await db.update(studentsTable).set({ password: newPassword }).where(eq(studentsTable.id, id));
  res.json({ newPassword });
});

export default router;
