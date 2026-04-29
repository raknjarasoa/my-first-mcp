import { Session } from "../types.js";
import { SESSION_TTL_MS } from "../constants.js";

const sessions = new Map<string, Session>();

export function createSession(
  computeToken: string,
  llmKey: string,
  userId: string
): Session {
  const now = Date.now();
  const session: Session = {
    sessionId: crypto.randomUUID(),
    computeToken,
    llmKey,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    metadataCache: new Map(),
    viewCache: new Map(),
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function startSessionCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now > session.expiresAt) sessions.delete(id);
    }
  }, 30 * 60 * 1000);
}
