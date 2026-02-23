import RecordService from "../services/record.js";
import { parseObjectId } from "../utils/helpers.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function parsePagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    Math.max(Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );

  return { page, pageSize };
}

function parseListFilters(query = {}) {
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const searchBy = typeof query.searchBy === "string" ? query.searchBy.trim() : "all";

  return { search, searchBy };
}

export const getRecord = async (req, res) => {
  if (req.params.id === "new") return res.status(200).json({ ok: true });

  const workspaceId = parseObjectId(req.params.workspace);
  const recordId = parseObjectId(req.params.id);
  const recordService = new RecordService({
    userId: req.user.id,
    workspaceId,
  });
  const record = await recordService.get(recordId);
  res.status(200).json({ ok: true, record: record });
};

export const createRecord = async (req, res) => {
  const { title, state} = req.body ?? {};
  const workspaceId = parseObjectId(req.params.workspace);
  const recordService = new RecordService({
    userId: req.user.id,
    workspaceId,
  });
  const record = await recordService.create({ title, state });

  res.status(201).json({ ok: true, record });
};

export const updateRecord = async (req, res) => {
  const recordId = parseObjectId(req.params.id);
  const { title, state } = req.body ?? {};
  const workspaceId = parseObjectId(req.params.workspace);
  const recordService = new RecordService({
    userId: req.user.id,
    workspaceId,
  });
  const record = await recordService.update(recordId, { title, state });

  res.status(200).json(record);
};

export const listRecords = async (req, res) => {
  const workspaceId = parseObjectId(req.params.workspace);
  const { page, pageSize } = parsePagination(req.query);
  const { search, searchBy } = parseListFilters(req.query);
  const recordService = new RecordService({ userId: req.user.id, workspaceId });
  const { data, total } = await recordService.list({ page, pageSize, search, searchBy });

  res.status(200).json({
    records: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
};

export const deleteRecord = async (req, res) => {
  const recordId = parseObjectId(req.params.id);
  const workspaceId = parseObjectId(req.params.workspace);
  const recordService = new RecordService({
    userId: req.user.id,
    workspaceId,
  });
  const deleted = await recordService.delete(recordId);

  res.status(200).json(deleted);
};

export const bulkDeleteRecords = async (req, res) => {
  const workspaceId = parseObjectId(req.params.workspace);
  const recordService = new RecordService({ userId: req.user.id, workspaceId });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const result = await recordService.bulkDelete(ids);

  res.status(200).json(result);
};

export const bulkUpdateRecords = async (req, res) => {
  const workspaceId = parseObjectId(req.params.workspace);
  const recordService = new RecordService({ userId: req.user.id, workspaceId });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const updates = req.body?.updates ?? {};
  const result = await recordService.bulkUpdate(ids, updates);

  res.status(200).json(result);
};
