import recordService from "../services/record.js";
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
  const languageCode = typeof query.languageCode === "string" ? query.languageCode.trim().toUpperCase() : "";

  return { search, searchBy, languageCode };
}

export const getRecord = async (req, res) => {
  if (req.params.id === "new") return res.status(200).json({ ok: true });

  const workspaceId = parseObjectId(req.params.workspace);
  const articleId = parseObjectId(req.params.id);
  const articleService = new ArticleService({
    userId: req.user.id,
    workspaceId,
  });
  const article = await articleService.get(articleId);
  res.status(200).json({ ok: true, article: article });
};

export const createRecord = async (req, res) => {
  const { title, body, topicId, state, languageCode, sourceArticleId } = req.body ?? {};
  const workspaceId = parseObjectId(req.params.workspace);
  const articleService = new ArticleService({
    userId: req.user.id,
    workspaceId,
  });
  const article = await articleService.create({ title, body, topicId, state, languageCode, sourceArticleId });

  res.status(201).json({ ok: true, article });
};

export const updateRecord = async (req, res) => {
  const articleId = parseObjectId(req.params.id);
  const { title, body, topicId, state, languageCode } = req.body ?? {};
  const workspaceId = parseObjectId(req.params.workspace);
  const articleService = new ArticleService({
    userId: req.user.id,
    workspaceId,
  });
  const article = await articleService.update(articleId, { title, body, topicId, state, languageCode });

  res.status(200).json(article);
};

export const listRecords = async (req, res) => {
  const workspaceId = parseObjectId(req.params.workspace);
  const { page, pageSize } = parsePagination(req.query);
  const { search, searchBy, languageCode } = parseListFilters(req.query);
  const articleService = new ArticleService({ userId: req.user.id, workspaceId });
  const { data, total } = await articleService.list({ page, pageSize, search, searchBy, languageCode });

  res.status(200).json({
    articles: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
};

export const deleteRecord = async (req, res) => {
  const articleId = parseObjectId(req.params.id);
  const workspaceId = parseObjectId(req.params.workspace);
  const articleService = new ArticleService({
    userId: req.user.id,
    workspaceId,
  });
  const deleted = await articleService.delete(articleId);

  res.status(200).json(deleted);
};

export const bulkDeleteRecords = async (req, res) => {
  const workspaceId = parseObjectId(req.params.workspace);
  const articleService = new ArticleService({ userId: req.user.id, workspaceId });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const result = await articleService.bulkDelete(ids);

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
