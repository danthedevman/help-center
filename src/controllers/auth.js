import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../database/main.js";
import { sendEmail } from "../utils/mailer.js";

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 15;

export const register = async (req, res, next) => {
  try {
    const db = getDb();
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.collection("users").findOne({ email: normalizedEmail });

    if (existing?.passwordHash) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let userId;
    if (existing) {
      await db.collection("users").updateOne(
        { _id: existing._id },
        {
          $set: {
            passwordHash,
            status: "active",
            updatedAt: new Date(),
          },
        }
      );
      userId = existing._id.toString();
    } else {
      const result = await db.collection("users").insertOne({
        email: normalizedEmail,
        passwordHash,
        status: "active",
        createdAt: new Date(),
      });
      userId = result.insertedId.toString();
    }
    setAuthCookie(res, userId);

    return res
      .status(201)
      .json({ ok: true, user: { id: userId, email: normalizedEmail } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const db = getDb();
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.collection("users").findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Complete account setup before logging in" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (user.status !== "active") {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { status: "active", updatedAt: new Date() } }
      );
    }

    setAuthCookie(res, user._id.toString());
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const checkAuth = async (req, res, next) => {
  try {
    const db = getDb();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { passwordHash: 0, resetTokenHash: 0, resetTokenExpiresAt: 0 } }
    );

    return res.status(200).json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const db = getDb();
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.collection("users").findOne({ email: normalizedEmail });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const resetTokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            resetTokenHash,
            resetTokenExpiresAt,
            resetTokenCreatedAt: new Date(),
          },
        }
      );

      const appUrl = process.env.FRONTEND_URL || "http://localhost:5174";
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      await sendEmail({
        to: normalizedEmail,
        subject: "Reset your password",
        text: `Use this link to reset your password: ${resetUrl}. This link expires in 15 minutes.`,
        html: `<p>Use the link below to reset your password. It expires in <strong>15 minutes</strong>.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    }

    return res.status(200).json({
      ok: true,
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const db = getDb();
    const { token, password } = req.body ?? {};

    if (!token || !password) {
      return res.status(400).json({ error: "token and password are required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await db.collection("users").findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { passwordHash, status: "active" },
        $unset: {
          resetTokenHash: "",
          resetTokenExpiresAt: "",
          resetTokenCreatedAt: "",
        },
      }
    );

    setAuthCookie(res, user._id.toString());
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res, next) => {
  res.clearCookie("access_token");
  res.status(200).json({ ok: true });
};

function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });
}
