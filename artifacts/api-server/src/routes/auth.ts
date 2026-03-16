import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, studentProgressTable, supervisorsTable, adminsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";

const router: IRouter = Router();

router.post("/student/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول" });
    return;
  }

  const students = await db.select().from(studentsTable)
    .where(eq(studentsTable.phone, phone))
    .limit(1);

  if (!students.length || students[0].password !== password) {
    res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    return;
  }

  const student = students[0];
  const progressRows = await db.select().from(studentProgressTable)
    .where(eq(studentProgressTable.studentId, student.id))
    .limit(1);

  let progress = progressRows[0];
  if (!progress) {
    const inserted = await db.insert(studentProgressTable)
      .values({ studentId: student.id })
      .returning();
    progress = inserted[0];
  }

  const { password: _pw, ...studentSafe } = student;
  res.json({ ...studentSafe, progress });
});

router.post("/student/register", async (req, res) => {
  const { name, phone, password, country, gender, tajweedLevel } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول" });
    return;
  }

  const existing = await db.select().from(studentsTable)
    .where(eq(studentsTable.phone, phone))
    .limit(1);

  if (existing.length) {
    res.status(400).json({ error: "رقم الهاتف مسجل مسبقاً" });
    return;
  }

  const inserted = await db.insert(studentsTable)
    .values({ name, phone, password, country: country || "", gender: gender || "", tajweedLevel: tajweedLevel || "beginner" })
    .returning();

  const student = inserted[0];
  const progress = await db.insert(studentProgressTable)
    .values({ studentId: student.id })
    .returning();

  const { password: _pw, ...studentSafe } = student;
  res.json({ ...studentSafe, progress: progress[0] });
});

router.post("/supervisor/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول" });
    return;
  }

  const rows = await db.select().from(supervisorsTable)
    .where(eq(supervisorsTable.phone, phone))
    .limit(1);

  if (!rows.length || rows[0].password !== password) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  const supervisor = rows[0];
  const studentCount = await db.select({ count: count() }).from(studentsTable)
    .where(eq(studentsTable.supervisorId, supervisor.id));

  const students = await db.select().from(studentsTable)
    .where(eq(studentsTable.supervisorId, supervisor.id));

  const studentsWithProgress = await Promise.all(students.map(async (s) => {
    const progress = await db.select().from(studentProgressTable)
      .where(eq(studentProgressTable.studentId, s.id))
      .limit(1);
    const { password: _pw, ...safe } = s;
    return { ...safe, progress: progress[0] || null };
  }));

  const { password: _pw, ...supervisorSafe } = supervisor;
  res.json({
    supervisor: { ...supervisorSafe, studentCount: studentCount[0]?.count ?? 0 },
    students: studentsWithProgress
  });
});

router.post("/admin/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول" });
    return;
  }

  const rows = await db.select().from(adminsTable)
    .where(eq(adminsTable.phone, phone))
    .limit(1);

  if (!rows.length || rows[0].password !== password) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  const [totalStudents] = await db.select({ count: count() }).from(studentsTable);
  const [totalSupervisors] = await db.select({ count: count() }).from(supervisorsTable);
  const [starsResult] = await db.select({ total: sum(studentProgressTable.totalStars) }).from(studentProgressTable);

  res.json({
    role: "admin",
    stats: {
      totalStudents: totalStudents.count,
      activeStudents: totalStudents.count,
      totalSupervisors: totalSupervisors.count,
      totalStars: Number(starsResult.total) || 0,
    }
  });
});

export default router;
