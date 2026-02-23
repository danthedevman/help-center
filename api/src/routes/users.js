import { Router } from "express";
import {
  inviteWorkspaceUser,
  listWorkspaceUsers,
  makeWorkspaceOwner,
  removeWorkspaceUser,
} from "../controllers/users.js";

const router = Router({ mergeParams: true });

router.get("/users", listWorkspaceUsers);
router.post("/users/invite", inviteWorkspaceUser);
router.delete("/users/:userId", removeWorkspaceUser);
router.patch("/users/:userId/owner", makeWorkspaceOwner);

export default router;
