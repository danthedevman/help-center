import { ObjectId } from "mongodb";
import { getDb } from "../database/main.js";


class WorkspaceService {
  constructor({ userId }) {
    if (!userId) throw new Error("WorkspaceService requires userId");
    this.userId = userId;
    this.db = getDb();
  }

  static toObjectId(id) {
    if (!ObjectId.isValid(id)) return null;
    return new ObjectId(id);
  }

  async get(id) {
    const workspaceId = WorkspaceService.toObjectId(id);
    if (!workspaceId) throw new Error("invalid workspace id");

    const membership = await this.db.collection("workspace_members").findOne({
      workspaceId,
      userId: this.userId,
    });

    if (!membership) {
      const err = new Error("no access to workspace");
      err.status = 403;
      throw err;
    }

    const workspace = await this.db.collection("workspaces").findOne({
      _id: workspaceId,
    });

    if (!workspace) {
      const err = new Error("workspace not found");
      err.status = 404;
      throw err;
    }

    return {
      workspaceId: workspace._id.toString(),
      name: workspace.name,
      role: membership.role,
      createdAt: workspace.createdAt,
    };
  }

  async list() {
    return this.db
      .collection("workspace_members")
      .aggregate([
        { $match: { userId: this.userId } },
        {
          $lookup: {
            from: "workspaces",
            localField: "workspaceId",
            foreignField: "_id",
            as: "workspace",
          },
        },
        { $unwind: "$workspace" },
        {
          $set: {
            workspaceId: { $toString: "$workspace._id" },
            name: "$workspace.name",
            createdAt: "$workspace.createdAt",
          },
        },
        {
          $project: {
            _id: 0,
            workspaceId: 1,
            name: 1,
            role: 1,
            createdAt: 1,
          },
        },
      ])
      .toArray();
  }

  async create(name) {
    if (!name) throw new Error("name is required");

    const wsRes = await this.db.collection("workspaces").insertOne({
      name,
      createdAt: new Date(),
      createdBy: this.userId
    });

    const workspaceId = wsRes.insertedId;

    await this.db.collection("workspace_members").insertOne({
      workspaceId,
      userId: this.userId,
      role: "owner",
      createdAt: new Date(),
    });

    return { workspaceId: workspaceId.toString() };
  }

  async update(id, { name }) {
    const workspaceId = WorkspaceService.toObjectId(id);
    if (!workspaceId) throw new Error("invalid workspace id");

    const membership = await this.db.collection("workspace_members").findOne({
      workspaceId,
      userId: this.userId,
    });
    if (!membership) {
      const err = new Error("no access to workspace");
      err.status = 403;
      throw err;
    }

    const updateDoc = { updatedAt: new Date() };
    if (name) updateDoc.name = name;

    await this.db
      .collection("workspaces")
      .updateOne({ _id: workspaceId }, { $set: updateDoc });

    return { ok: true };
  }

  async delete(id) {
    const workspaceId = WorkspaceService.toObjectId(id);
    if (!workspaceId) throw new Error("invalid workspace id");

    // Owner-only delete
    const membership = await this.db.collection("workspace_members").findOne({
      workspaceId,
      userId: this.userId,
    });
    if (!membership) {
      const err = new Error("no access to workspace");
      err.status = 403;
      throw err;
    }
    if (membership.role !== "owner") {
      const err = new Error("only owners can delete workspaces");
      err.status = 403;
      throw err;
    }

    await this.db.collection("workspaces").deleteOne({ _id: workspaceId });
    await this.db.collection("workspace_members").deleteMany({ workspaceId });

    return { ok: true };
  }
}

export default WorkspaceService;
