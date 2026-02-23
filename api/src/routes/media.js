import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/media.js";

const router = Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post("/media/upload-image", upload.single("image"), uploadImage);

export default router;
