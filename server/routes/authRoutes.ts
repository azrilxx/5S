import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { validateBody } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/security.js";
import { auditLoginAttempt } from "../middleware/auditLogger.js";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "../controllers/authController.js";

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Apply audit logging to all auth routes
router.use(auditLoginAttempt);

// Public routes
router.post("/login", validateBody(loginSchema), AuthController.login);
router.post("/register", validateBody(registerSchema), AuthController.register);
router.post("/refresh", validateBody(refreshTokenSchema), AuthController.refresh);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get("/me", AuthController.getProfile);
router.put("/change-password", validateBody(changePasswordSchema), AuthController.changePassword);
router.post("/logout", AuthController.logout);

export default router;