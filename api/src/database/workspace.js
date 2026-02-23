import { getClient } from "./main.js";

export const getWorkspaceDb = (workspaceId) => {
  if (!workspaceId) throw new Error("workspaceId is required");
  const client = getClient();
  return client.db(`ws_${workspaceId}`);
};
