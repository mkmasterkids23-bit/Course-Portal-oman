import { SESSION_COOKIE } from "./server";

/**
 * Cookie options for the session token.
 *
 * The preview panel loads the app inside a cross-site iframe. Browsers do not
 * send `SameSite=Lax` cookies on cross-site sub-resource requests (fetch/XHR
 * initiated from within an iframe whose top-level site differs). To keep the
 * session working inside the preview iframe we must use `SameSite=None` with
 * `Secure=true`. The gateway terminates TLS so the browser always sees HTTPS
 * even though the upstream is plain HTTP.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function buildCookieHeader(): Record<string, string> {
  return {};
}

export { SESSION_COOKIE };
