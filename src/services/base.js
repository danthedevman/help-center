import { ObjectId } from "mongodb";
import { getWorkspaceDb } from "../database/workspace.js";
import { getDb as getMainDb } from "../database/main.js";

class BaseWorkspaceService {
  constructor({ workspaceId, userId }) {
    if (!workspaceId) throw new Error("workspaceId is required");
    this.workspaceId = workspaceId;
    this.userId = userId ?? null;
  }

  // Useful in all services
  static toObjectId(id, label = "id") {
    if (!ObjectId.isValid(id)) {
      const err = new Error(`invalid ${label}`);
      err.status = 400;
      throw err;
    }
    return new ObjectId(id);
  }

  // Workspace DB (ws_<workspaceId>)
  async wsDb() {
    return getWorkspaceDb(this.workspaceId);
  }

  // Main DB (main)
  mainDb() {
    return getMainDb();
  }

  // ---- user hydration helpers ----
  async hydrateUser(userIdStr) {
    if (!userIdStr || !ObjectId.isValid(userIdStr)) return null;

    const user = await this.mainDb()
      .collection("users")
      .findOne(
        { _id: new ObjectId(userIdStr) },
        { projection: { passwordHash: 0 } }
      );

    return user ? { ...user, _id: user._id.toString() } : null;
  }

  async hydrateUsersForDocs(docs, field = "createdBy") {
    const ids = [...new Set(docs.map((d) => d?.[field]).filter(Boolean))];
    const validIds = ids.filter(ObjectId.isValid);
    if (!validIds.length) return new Map();

    const users = await this.mainDb()
      .collection("users")
      .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
      .project({ passwordHash: 0 })
      .toArray();

    const map = new Map();
    for (const u of users) map.set(u._id.toString(), { ...u, _id: u._id.toString() });
    return map;
  }

  // Convenience: attach createdBy user objects
  attachUsers(docs, usersById, field = "createdBy", outputField = "createdBy") {
    return docs.map((d) => ({
      ...d,
      _id: d._id?.toString?.() ?? d._id,
      [outputField]: d?.[field] ? usersById.get(d[field]) ?? null : null,
    }));
  }
}

export default BaseWorkspaceService;