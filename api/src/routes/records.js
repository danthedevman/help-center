import { Router } from 'express';
import {
  bulkDeleteRecords,
  bulkUpdateRecords,
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
} from "../controllers/records.js";
const router = Router({ mergeParams: true });

router.get("/records", listRecords);
router.patch("/records", bulkUpdateRecords);
router.delete("/records", bulkDeleteRecords);
router.get("/records/:id",getRecord);
router.post("/records",createRecord);
router.post("/records/:id",updateRecord);
router.put("/records/:id",updateRecord);
router.delete("/records/:id",deleteRecord);

export default router;
