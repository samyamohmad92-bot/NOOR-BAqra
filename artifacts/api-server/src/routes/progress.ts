import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:studentId", async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const rows = await db.select().from(studentProgressTable)
    .where(eq(studentProgressTable.studentId, studentId))
    .limit(1);

  if (!rows.length) {
    res.status(404).json({ error: "لا يوجد سجل تقدم لهذا الطالب" });
    return;
  }
  res.json(rows[0]);
});

router.patch("/:studentId", async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  const fields = ['currentWajh', 'correctCount', 'currentSession', 'totalStars', 'waitingTeacher', 'hashdCompleted', 'testAttempts'];
  const dbFieldMap: Record<string, string> = {
    currentWajh: 'currentWajh',
    correctCount: 'correctCount',
    currentSession: 'currentSession',
    totalStars: 'totalStars',
    waitingTeacher: 'waitingTeacher',
    hashdCompleted: 'hashdCompleted',
    testAttempts: 'testAttempts',
  };

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates[dbFieldMap[field]] = req.body[field];
    }
  }

  const updated = await db.update(studentProgressTable)
    .set(updates)
    .where(eq(studentProgressTable.studentId, studentId))
    .returning();

  if (!updated.length) {
    // Create if not exists
    const created = await db.insert(studentProgressTable)
      .values({ studentId, ...updates })
      .returning();
    res.json(created[0]);
    return;
  }

  res.json(updated[0]);
});

export default router;
