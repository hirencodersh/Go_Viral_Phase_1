import { Router } from "express";
import { authRateLimit } from "../middleware/authRateLimit";
import { authenticate } from "../middleware/authenticate";
import { login, logout, me, register } from "../controllers/auth.controller";
import { loginSchema, registerSchema, validateBody } from "../validators/auth.validation";

const router = Router();

router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
