import { getDb } from "../database/main.js";
import { sendEmail } from "../utils/mailer.js";
import { parseObjectId } from "../utils/helpers.js";

function resolveUserStatus(user) {
  if (!user) return "pending";
  if (user.status) return user.status;
  return user.passwordHash ? "active" : "pending";
}

function requireOwner(req, res) {
  if (req.workspace.membership.role !== "owner") {
    res.status(403).json({ error: "Only owners can manage users" });
    return false;
  }

  return true;
}

export const listWorkspaceUsers = async (req, res, next) => {
  try {
    const db = getDb();
    const members = await db
      .collection("workspace_members")
      .aggregate([
        { $match: { workspaceId: req.workspace.id } },
        {
          $lookup: {
            from: "users",
            let: { memberUserId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toString: "$_id" }, "$$memberUserId"],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  email: 1,
                  status: 1,
                  hasPassword: {
                    $cond: [{ $ifNull: ["$passwordHash", false] }, true, false],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $project: {
            _id: 0,
            userId: 1,
            role: 1,
            email: { $ifNull: [{ $first: "$user.email" }, null] },
            status: { $ifNull: [{ $first: "$user.status" }, "pending"] },
            hasPassword: { $ifNull: [{ $first: "$user.hasPassword" }, false] },
          },
        },
      ])
      .toArray();

    const users = members.map((member) => ({
      userId: member.userId,
      email: member.email,
      role: member.role,
      status: member.status || (member.hasPassword ? "active" : "pending"),
    }));

    return res.status(200).json({
      users,
      currentUserRole: req.workspace.membership.role,
      currentUserId: req.user.id,
    });
  } catch (err) {
    next(err);
  }
};

export const inviteWorkspaceUser = async (req, res, next) => {
  try {
    if (!requireOwner(req, res)) return;

    const db = getDb();
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await db.collection("users").findOne({ email: normalizedEmail });

    if (!user) {
      const created = await db.collection("users").insertOne({
        email: normalizedEmail,
        status: "pending",
        createdAt: new Date(),
      });

      user = {
        _id: created.insertedId,
        email: normalizedEmail,
        status: "pending",
      };
    } else {
      const computedStatus = resolveUserStatus(user);
      if (user.status !== computedStatus) {
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { status: computedStatus } });
        user.status = computedStatus;
      }
    }

    const userId = user._id.toString();
    const existingMembership = await db.collection("workspace_members").findOne({
      workspaceId: req.workspace.id,
      userId,
    });

    if (!existingMembership) {
      await db.collection("workspace_members").insertOne({
        workspaceId: req.workspace.id,
        userId,
        role: "editor",
        createdAt: new Date(),
      });
    }

    const appUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const inviteUrl = `${appUrl}/w/${req.params.workspace}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "You're invited to a workspace",
      text: `You have been invited to collaborate on a workspace. Open this link to continue: ${inviteUrl}`,
      html: `<p>You have been invited to collaborate on a workspace.</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
    });

    return res.status(200).json({
      ok: true,
      message: existingMembership ? "User already in workspace" : "Invite sent",
      status: resolveUserStatus(user),
    });
  } catch (err) {
    next(err);
  }
};

export const removeWorkspaceUser = async (req, res, next) => {
  try {
    if (!requireOwner(req, res)) return;

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ error: "Owners cannot remove themselves" });
    }

    const db = getDb();
    const removed = await db.collection("workspace_members").deleteOne({
      workspaceId: req.workspace.id,
      userId,
    });

    if (!removed.deletedCount) {
      return res.status(404).json({ error: "Workspace user not found" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const makeWorkspaceOwner = async (req, res, next) => {
  try {
    if (!requireOwner(req, res)) return;

    const db = getDb();
    const userId = req.params.userId;
    const parsedId = parseObjectId(userId);
    if (!userId || !parsedId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const membership = await db.collection("workspace_members").findOne({
      workspaceId: req.workspace.id,
      userId,
    });

    if (!membership) {
      return res.status(404).json({ error: "Workspace user not found" });
    }

    if (membership.role === "owner") {
      return res.status(200).json({ ok: true, message: "User is already an owner" });
    }

    await db.collection("workspace_members").updateOne(
      {
        workspaceId: req.workspace.id,
        userId,
      },
      {
        $set: {
          role: "owner",
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
