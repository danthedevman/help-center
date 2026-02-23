import jwt from "jsonwebtoken";

export function requireAuth (req, res, next){
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}