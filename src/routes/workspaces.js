import { Router } from 'express';
import {listWorkspaces,createWorkspace,deleteWorkspace,updateWorkspace} from "../controllers/workspaces.js"
import {requireAuth} from "../middleware/auth.js";
const router = Router();

router.get("/workspaces", requireAuth, listWorkspaces);

router.post("/workspaces", requireAuth, createWorkspace);

router.put("/workspaces/:workspace", requireAuth, updateWorkspace);

router.delete("/workspaces/:workspace", requireAuth, deleteWorkspace);

export default router;