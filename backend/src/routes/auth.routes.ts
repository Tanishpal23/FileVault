import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validateBody";
import {
  registerSchema,
  verifySignupOtpSchema,
  resendSignupOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/verify-signup", validateBody(verifySignupOtpSchema), authController.verifySignup);
router.post("/resend-signup-otp", validateBody(resendSignupOtpSchema), authController.resendSignupOtp);
router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", validateBody(refreshTokenSchema), authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

router.post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validateBody(verifyOtpSchema), authController.verifyOtp);
router.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);
router.delete("/account", requireAuth, authController.deleteAccount);

export default router;
