import { Request, Response, Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Social Media Platform API is running!",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);

export default router;