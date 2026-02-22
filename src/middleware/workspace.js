import { getDb } from "../database/main.js";
import { parseObjectId } from "../utils/helpers.js";
export async function requireWorkspaceAccess(req, res, next) {
  const db = getDb();

  const workspaceIdStr = req.params.workspace;
  const workspaceId = parseObjectId(workspaceIdStr);
  if (!workspaceId)
    return res.status(400).json({ error: "Invalid workspace id" });

  const userId = req.user.id;

  const membership = await db.collection("workspace_members").findOne({
    workspaceId,
    userId,
  });

  if (!membership) {
    return res.status(403).json({ error: "No access to workspace" });
  }

  // Handy for handlers
  req.workspace = { id: workspaceId, membership };
  next();
}