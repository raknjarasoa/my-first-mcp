import { Request, Response, NextFunction } from "express";
import { getSession } from "./store.js";
import { Session } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      session?: Session;
    }
  }
}

export function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const sessionId = req.headers["x-session-id"];
  if (typeof sessionId !== "string" || !sessionId) {
    res.status(401).json({ error: "Missing x-session-id header" });
    return;
  }
  const session = getSession(sessionId);
  if (!session) {
    res.status(401).json({
      error:
        "Session expired or invalid. Re-initialize via POST /mcp/session/init",
    });
    return;
  }
  req.session = session;
  next();
}
