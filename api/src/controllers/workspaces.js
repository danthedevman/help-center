import WorkspaceService from "../services/workspace.js";

export const createWorkspace = async (req,res,next)=>{
  try {
    const { name } = req.body ?? {};
    const workspaceService = new WorkspaceService({ userId: req.user.id });
    const workspace = await workspaceService.create(name);

    res.status(201).json({ ok: true, workspace });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req,res,next)=>{
  try {
    const { workspace } = req.params;
    const { name } = req.body ?? {};

    const workspaceService = new WorkspaceService({ userId: req.user.id });
    await workspaceService.update(workspace, { name });

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const listWorkspaces = async (req,res,next)=>{
  try {
    const workspaceService = new WorkspaceService({ userId: req.user.id });
    const workspaces = await workspaceService.list();

    res.status(200).json({ workspaces: workspaces });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkspace = async (req,res,next)=>{
  try {
    const { workspace } = req.params;
    const { confirmationName } = req.body ?? {};

    const workspaceService = new WorkspaceService({ userId: req.user.id });
    const workspaceData = await workspaceService.get(workspace);

    if (confirmationName !== workspaceData.name) {
      return res.status(400).json({ error: "Workspace name does not match confirmation" });
    }

    await workspaceService.delete(workspace);

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
