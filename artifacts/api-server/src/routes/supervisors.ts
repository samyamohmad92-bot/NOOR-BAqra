import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { supervisorsTable, studentsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const supervisors = await db.select().from(supervisorsTable).orderBy(supervisorsTable.createdAt);
  const result = await Promise.all(supervisors.map(async (s) => {
    const [cnt] = await db.select({ count: count() }).from(studentsTable)
      .where(eq(studentsTable.supervisorId, s.id));
    const { password: _pw, ...safe } = s;
    return { ...safe, studentCount: cnt.count };
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول" });
    return;
  }

  const existing = await db.select().from(supervisorsTable).where(eq(supervisorsTable.phone, phone)).limit(1);
  if (existing.length) {
    res.status(400).json({ error: "رقم الهاتف مسجل مسبقاً" });
    return;
  }

  const inserted = await db.insert(supervisorsTable).values({ name, phone, password }).returning();
  const { password: _pw, ...safe } = inserted[0];
  res.json({ ...safe, studentCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(supervisorsTable).where(eq(supervisorsTable.id, id));
  res.json({ success: true });
});

export default router;
