

import { Router } from 'express';
import {
  register,
  login,
  checkAuth,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/auth/check",requireAuth,checkAuth);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/password/forgot", forgotPassword);
router.post("/password/reset", resetPassword);

export default router;
