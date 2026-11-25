import { Router } from "express";
import { authRateLimit } from "../middleware/authRateLimit";
import { authenticate } from "../middleware/authenticate";
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  validateBody,
} from "../validators/auth.validation";

const router = Router();

router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.post("/forgot-password", authRateLimit, validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authRateLimit, validateBody(resetPasswordSchema), resetPassword);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
