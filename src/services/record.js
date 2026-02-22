import { ObjectId } from "mongodb";
import BaseWorkspaceService from "./base.js";

class RecordService extends BaseWorkspaceService {
  static ALLOWED_STATES = new Set(["draft", "published", "archived"]);

  validateState(state) {
    if (state === undefined) return;
    if (!RecordService.ALLOWED_STATES.has(state)) {
      const err = new Error('Invalid state.');
      err.status = 400;
      throw err;
    }
  }

   normalizeRequiredTitle(title) {
    if (typeof title !== "string") {
      const err = new Error("title is required");
      err.status = 400;
      throw err;
    }

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      const err = new Error("title is required");
      err.status = 400;
      throw err;
    }

    return normalizedTitle;
  }

  normalizeIds(ids = []) {
    const valid = ids.filter((id) => typeof id === "string" && ObjectId.isValid(id));
    return [...new Set(valid)];
  }

  async get(id) {
    const _id = this.constructor.toObjectId(id, "record id");
    const wsDb = await this.wsDb();

    const record = await wsDb.collection("records").findOne({ _id });
    if (!record) {
      const err = new Error("record not found");
      err.status = 404;
      throw err;
    }

    const recordIdStr = record._id.toString();

    const [createdBy, updatedBy] = await Promise.all([
      this.hydrateUser(record.createdBy),
      this.hydrateUser(record.updatedBy)
    ]);

    return {
      ...record,
      _id: recordIdStr,
      state: record.state ?? "draft",
      createdBy,
      updatedBy
    };
  }

  buildSearchMatch(search = "", searchBy = "all") {
    if (!search) return {};

    const regex = { $regex: search, $options: "i" };
    if (searchBy === "all") {
      return {
        $or: [{ title: regex }],
      };
    }

    const fields = RecordService.SEARCH_FIELDS[searchBy] || [];
    if (!fields.length) return {};

    return {
      $or: fields.map((field) => ({ [field]: regex })),
    };
  }

  async list({ page = 1, pageSize = 10, search = "", searchBy = "all" } = {}) {
    const wsDb = await this.wsDb();
    const skip = (page - 1) * pageSize;

    const pipeline = [
      {
        $addFields: {
          stateLabel: "$state",
        },
      },
    ];

    const searchMatch = this.buildSearchMatch(search, searchBy);
    if (Object.keys(searchMatch).length) {
      pipeline.push({ $match: searchMatch });
    }

    pipeline.push(
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageSize },
            {
              $unset: ["stateLabel"],
            },
          ],
          meta: [{ $count: "total" }],
        },
      }
    );

    const [result] = await wsDb.collection("records").aggregate(pipeline).toArray();
    const records = result?.data || [];
    const total = result?.meta?.[0]?.total || 0;

    const [usersById, versionMap] = await Promise.all([
      this.hydrateUsersForDocs(records, "createdBy"),
    ]);

    const withUsers = this.attachUsers(records, usersById, "createdBy", "createdBy");

    return {
      data: withUsers.map((a) => ({
        ...a,
        _id: a._id?.toString?.() ?? a._id,
      })),
      total,
    };
  }

  async create({ title, state }) {
    const normalizedTitle = this.normalizeRequiredTitle(title);

    this.validateState(state);
    const finalState = state ?? "draft";

    const wsDb = await this.wsDb();

    const result = await wsDb.collection("records").insertOne({
      title: normalizedTitle,
      state: finalState,
      createdAt: new Date(),
      createdBy: this.userId ?? null,
      updatedAt: null,
      updatedBy: null,
    });

    return { recordId: result.insertedId.toString() };
  }

  async update(id, { title, state }) {
    const _id = this.constructor.toObjectId(id, "record id");
    this.validateState(state);

    const wsDb = await this.wsDb();

    const current = await wsDb.collection("records").findOne({ _id });
    if (!current) {
      const err = new Error("record not found");
      err.status = 404;
      throw err;
    }

    const prevState = current.state ?? "draft";

    const $set = {
      updatedAt: new Date(),
      updatedBy: this.userId ?? null,
    };

    if (title !== undefined) $set.title = this.normalizeRequiredTitle(title);
    if (state !== undefined) $set.state = state;

    const result = await wsDb.collection("records").updateOne({ _id }, { $set });
    if (result.matchedCount === 0) {
      const err = new Error("record not found");
      err.status = 404;
      throw err;
    }

    return { ok: true };
  }

  async delete(id) {
    const _id = this.constructor.toObjectId(id, "record id");
    const wsDb = await this.wsDb();

    const result = await wsDb.collection("records").deleteOne({ _id });
    if (result.deletedCount === 0) {
      const err = new Error("record not found");
      err.status = 404;
      throw err;
    }

    return { ok: true };
  }

  async bulkDelete(ids = []) {
    const normalizedIds = this.normalizeIds(ids);
    if (!normalizedIds.length) return { ok: true, deletedCount: 0 };

    const wsDb = await this.wsDb();
    const result = await wsDb
      .collection("records")
      .deleteMany({ _id: { $in: normalizedIds.map((id) => new ObjectId(id)) } });

    return { ok: true, deletedCount: result.deletedCount };
  }

  async bulkUpdate(ids = [], updates = {}) {
    const normalizedIds = this.normalizeIds(ids);
    if (!normalizedIds.length) return { ok: true, matchedCount: 0, modifiedCount: 0 };

    const wsDb = await this.wsDb();
    const $set = {
      updatedAt: new Date(),
      updatedBy: this.userId ?? null,
    };

    if (updates.state !== undefined) {
      this.validateState(updates.state);
      $set.state = updates.state;
    }

    const result = await wsDb.collection("records").updateMany(
      { _id: { $in: normalizedIds.map((id) => new ObjectId(id)) } },
      { $set }
    );

    return {
      ok: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }
}

export default RecordService;
