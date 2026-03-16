import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, studentProgressTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const results = await db
    .select({
      id: studentsTable.id,
      name: studentsTable.name,
      totalStars: studentProgressTable.totalStars,
      currentWajh: studentProgressTable.currentWajh,
    })
    .from(studentsTable)
    .leftJoin(studentProgressTable, eq(studentsTable.id, studentProgressTable.studentId))
    .orderBy(desc(studentProgressTable.totalStars))
    .limit(10);

  const leaderboard = results.map((r, idx) => ({
    id: r.id,
    name: r.name,
    totalStars: r.totalStars ?? 0,
    currentWajh: r.currentWajh ?? 1,
    rank: idx + 1,
  }));

  res.json(leaderboard);
});

export default router;
