import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import progressRouter from "./progress";
import leaderboardRouter from "./leaderboard";
import supervisorsRouter from "./supervisors";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);
router.use("/progress", progressRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/supervisors", supervisorsRouter);

export default router;
